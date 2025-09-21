import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken, extractTokenFromHeader } from "@/lib/auth-utils"
import type { Match } from "@/lib/db-types"

export async function GET(request: NextRequest) {
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

    const matchesCollection = await getCollection("matches")

    // Get all waiting matches that are not full
    const matches = (await matchesCollection
      .find({
        status: "waiting",
        $expr: { $lt: [{ $size: "$participants" }, 2] }, // Less than 2 participants
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()) as Match[]

    const formattedMatches = matches.map((match) => ({
      ...match,
      _id: match._id!.toString(),
      hostId: match.hostId.toString(),
      participants: match.participants.map((id) => id.toString()),
    }))

    return NextResponse.json({ matches: formattedMatches })
  } catch (error) {
    console.error("Browse matches error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
