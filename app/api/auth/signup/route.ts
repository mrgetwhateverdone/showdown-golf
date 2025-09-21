import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { hashPassword, generateToken } from "@/lib/auth-utils"
import type { User } from "@/lib/db-types"

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    // Validate input
    if (!email || !password || !username) {
      return NextResponse.json({ error: "Email, password, and username are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    const usersCollection = await getCollection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { displayName: username }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 409 })
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const now = new Date()

    const newUser: Omit<User, "_id"> = {
      email,
      displayName: username,
      passwordHash,
      balance: 1000, // Starting balance of $1,000
      handicap: 0,
      friends: [],
      createdAt: now,
      updatedAt: now,
    }

    const result = await usersCollection.insertOne(newUser)
    const userId = result.insertedId

    // Generate JWT token
    const token = generateToken(userId, email)

    // Return user data (without password hash)
    const userResponse = {
      id: userId.toString(),
      email,
      username,
      balance: 1000,
      handicap: 0,
      friends: [],
      createdAt: now.toISOString(),
    }

    return NextResponse.json(
      {
        user: userResponse,
        token,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
