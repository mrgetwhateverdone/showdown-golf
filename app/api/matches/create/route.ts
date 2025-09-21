import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken, extractTokenFromHeader } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import type { Match, User } from "@/lib/db-types"

// Sample courses data
const SAMPLE_COURSES = [
  {
    id: "blue-hills-cc",
    name: "Blue Hills Country Club",
    location: "Kansas City, Missouri",
    holes: 18,
    par: [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4],
  },
  {
    id: "country-club-kc",
    name: "The Country Club of Kansas City",
    location: "Mission Hills, Kansas",
    holes: 18,
    par: [4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 4, 4],
  },
  // Add more courses as needed
]

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

    const { gameType, format, courseId, wager, isBot } = await request.json()

    // Validate input
    if (!gameType || !format || !courseId) {
      return NextResponse.json({ error: "Game type, format, and course are required" }, { status: 400 })
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

    // Check if user has enough balance for wager
    if (wager > 0 && user.balance < wager) {
      return NextResponse.json({ error: "Insufficient balance for wager" }, { status: 400 })
    }

    // Find course
    const course = SAMPLE_COURSES.find((c) => c.id === courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Determine max players based on format
    const maxPlayers = format === "1v1" ? 2 : format === "2v1" ? 3 : 4

    // Create match
    const now = new Date()
    const newMatch: Omit<Match, "_id"> = {
      hostId: new ObjectId(payload.userId),
      participants: [new ObjectId(payload.userId)],
      gameType: gameType as "stroke-play" | "match-play" | "skins",
      betAmount: wager || 0,
      status: "waiting",
      currentHole: 1,
      scores: {},
      course: {
        name: course.name,
        holes: Array.from({ length: course.holes }, (_, i) => ({
          number: i + 1,
          par: course.par[i] || 4,
          yardage: 350 + Math.floor(Math.random() * 200), // Random yardage for now
        })),
      },
      createdAt: now,
      updatedAt: now,
    }

    // If it's a bot match, add bot participant
    if (isBot) {
      // For bot matches, we'll handle the bot logic in the client
      newMatch.status = "in-progress"
    }

    const result = await matchesCollection.insertOne(newMatch)

    // Deduct wager from user's balance if there's a wager
    if (wager > 0) {
      await usersCollection.updateOne(
        { _id: new ObjectId(payload.userId) },
        {
          $inc: { balance: -wager },
          $set: { updatedAt: now },
        },
      )
    }

    return NextResponse.json(
      {
        matchId: result.insertedId.toString(),
        match: {
          ...newMatch,
          _id: result.insertedId,
          hostId: newMatch.hostId.toString(),
          participants: newMatch.participants.map((id) => id.toString()),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create match error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
