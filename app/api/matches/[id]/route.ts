import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken, extractTokenFromHeader } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import type { Match } from "@/lib/db-types"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (!ObjectId.isValid(matchId)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 })
    }

    const matchesCollection = await getCollection("matches")

    // Get match
    const match = (await matchesCollection.findOne({
      _id: new ObjectId(matchId),
    })) as Match | null

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user is participant in the match
    const userIdObj = new ObjectId(payload.userId)
    if (!match.participants.some((id) => id.equals(userIdObj))) {
      return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 })
    }

    return NextResponse.json({
      match: {
        ...match,
        _id: match._id!.toString(),
        hostId: match.hostId.toString(),
        participants: match.participants.map((id) => id.toString()),
      },
    })
  } catch (error) {
    console.error("Get match error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
