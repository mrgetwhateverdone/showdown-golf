import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken, extractTokenFromHeader } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/db-types"

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

    const usersCollection = await getCollection("users")

    // Find user by ID
    const user = (await usersCollection.findOne({
      _id: new ObjectId(payload.userId),
    })) as User | null

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user data (without password hash)
    const userResponse = {
      id: user._id!.toString(),
      email: user.email,
      username: user.displayName,
      balance: user.balance,
      handicap: user.handicap,
      friends: user.friends.map((id) => id.toString()),
      createdAt: user.createdAt.toISOString(),
    }

    return NextResponse.json({ user: userResponse })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
