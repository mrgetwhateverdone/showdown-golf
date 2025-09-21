import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken, extractTokenFromHeader } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import type { Match, Transaction } from "@/lib/db-types"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get("authorization")
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const matchId = params.id
    const { hole, strokes } = await request.json()

    if (!ObjectId.isValid(matchId) || !hole || !strokes) {
      return NextResponse.json({ error: "Invalid match ID, hole, or strokes" }, { status: 400 })
    }

    const matchesCollection = await getCollection("matches")
    const userIdObj = new ObjectId(payload.userId)

    // Get match
    const match = (await matchesCollection.findOne({
      _id: new ObjectId(matchId),
    })) as Match | null

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user is participant
    if (!match.participants.some((id) => id.equals(userIdObj))) {
      return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 })
    }

    // Update score
    const updatedScores = { ...match.scores }
    if (!updatedScores[payload.userId]) {
      updatedScores[payload.userId] = []
    }
    updatedScores[payload.userId][hole - 1] = strokes

    // Check if match is complete (all 18 holes played by all participants)
    const isComplete = match.participants.every((participantId) => {
      const participantScores = updatedScores[participantId.toString()]
      return participantScores && participantScores.length === 18 && participantScores.every((score) => score > 0)
    })

    let winner: ObjectId | undefined
    let status = match.status

    if (isComplete) {
      // Calculate winner
      const totals = match.participants.map((participantId) => ({
        participantId,
        total: updatedScores[participantId.toString()].reduce((sum: number, score: number) => sum + score, 0),
      }))

      winner = totals.reduce((prev, current) => (current.total < prev.total ? current : prev)).participantId
      status = "completed"
    }

    // Update match
    const updateData: any = {
      scores: updatedScores,
      updatedAt: new Date(),
      currentHole: Math.min(hole + 1, 18),
    }

    if (isComplete) {
      updateData.status = status
      updateData.completedAt = new Date()
    }

    await matchesCollection.updateOne({ _id: new ObjectId(matchId) }, { $set: updateData })

    // If match is complete and there's a wager, distribute prize
    if (isComplete && match.betAmount > 0 && winner) {
      await distributePrize(match, winner)
    }

    return NextResponse.json({ success: true, isComplete, winner: winner?.toString() })
  } catch (error) {
    console.error("Submit score error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to distribute prize money
async function distributePrize(match: Match, winnerId: ObjectId) {
  const usersCollection = await getCollection("users")
  const transactionsCollection = await getCollection("transactions")

  const totalPrize = match.betAmount * match.participants.length
  const now = new Date()

  // Add winnings to winner's balance
  await usersCollection.updateOne(
    { _id: winnerId },
    {
      $inc: { balance: totalPrize },
      $set: { updatedAt: now },
    },
  )

  // Record win transaction for winner
  const winTransaction: Omit<Transaction, "_id"> = {
    userId: winnerId,
    matchId: match._id!,
    type: "match-win",
    amount: totalPrize,
    description: `Won match against ${match.participants.length - 1} opponent(s)`,
    createdAt: now,
  }

  await transactionsCollection.insertOne(winTransaction)

  // Record loss transactions for losers
  for (const participantId of match.participants) {
    if (!participantId.equals(winnerId)) {
      const lossTransaction: Omit<Transaction, "_id"> = {
        userId: participantId,
        matchId: match._id!,
        type: "match-loss",
        amount: -match.betAmount,
        description: `Lost match wager`,
        createdAt: now,
      }

      await transactionsCollection.insertOne(lossTransaction)
    }
  }
}
