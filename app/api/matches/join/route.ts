import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken, extractTokenFromHeader } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import type { Match, User } from "@/lib/db-types"

export async function POST(request: NextRequest) {
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

    const { matchId } = await request.json()

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    const usersCollection = await getCollection("users")
    const matchesCollection = await getCollection("matches")

    // Get user info
    const user = (await usersCollection.findOne({
      _id: new ObjectId(payload.userId),
    })) as User | null

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get match info
    const match = (await matchesCollection.findOne({
      _id: new ObjectId(matchId),
    })) as Match | null

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if match is joinable
    if (match.status !== "waiting") {
      return NextResponse.json({ error: "Match is not available to join" }, { status: 400 })
    }

    // Check if user is already in the match
    const userIdObj = new ObjectId(payload.userId)
    if (match.participants.some((id) => id.equals(userIdObj))) {
      return NextResponse.json({ error: "You are already in this match" }, { status: 400 })
    }

    // Check if match is full (assuming max 2 players for now)
    if (match.participants.length >= 2) {
      return NextResponse.json({ error: "Match is full" }, { status: 400 })
    }

    // Check if user has enough balance for wager
    if (match.betAmount > 0 && user.balance < match.betAmount) {
      return NextResponse.json({ error: "Insufficient balance for wager" }, { status: 400 })
    }

    // Add user to match and deduct wager
    const now = new Date()
    const updateResult = await matchesCollection.updateOne(
      { _id: new ObjectId(matchId) },
      {
        $push: { participants: userIdObj },
        $set: {
          status: "in-progress", // Start match when second player joins
          updatedAt: now,
        },
      },
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to join match" }, { status: 500 })
    }

    // Deduct wager from user's balance if there's a wager
    if (match.betAmount > 0) {
      await usersCollection.updateOne(
        { _id: new ObjectId(payload.userId) },
        {
          $inc: { balance: -match.betAmount },
          $set: { updatedAt: now },
        },
      )
    }

    // Get updated match
    const updatedMatch = await matchesCollection.findOne({ _id: new ObjectId(matchId) })

    return NextResponse.json({
      success: true,
      match: {
        ...updatedMatch,
        _id: updatedMatch!._id.toString(),
        hostId: updatedMatch!.hostId.toString(),
        participants: updatedMatch!.participants.map((id: ObjectId) => id.toString()),
      },
    })
  } catch (error) {
    console.error("Join match error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
