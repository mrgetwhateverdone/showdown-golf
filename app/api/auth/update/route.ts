import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken, extractTokenFromHeader } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/db-types"

export async function PUT(request: NextRequest) {
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

    const { handicap, homeCourse } = await request.json()

    const usersCollection = await getCollection("users")

    // Update user
    const updateData: Partial<User> = {
      updatedAt: new Date(),
    }

    if (handicap !== undefined) {
      updateData.handicap = handicap
    }

    const result = await usersCollection.updateOne({ _id: new ObjectId(payload.userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get updated user
    const updatedUser = (await usersCollection.findOne({
      _id: new ObjectId(payload.userId),
    })) as User | null

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return updated user data
    const userResponse = {
      id: updatedUser._id!.toString(),
      email: updatedUser.email,
      username: updatedUser.displayName,
      balance: updatedUser.balance,
      handicap: updatedUser.handicap,
      friends: updatedUser.friends.map((id) => id.toString()),
      createdAt: updatedUser.createdAt.toISOString(),
    }

    return NextResponse.json({ user: userResponse })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
