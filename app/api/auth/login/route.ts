import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyPassword, generateToken } from "@/lib/auth-utils"
import type { User } from "@/lib/db-types"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const usersCollection = await getCollection("users")

    // Find user by email
    const user = (await usersCollection.findOne({ email })) as User | null

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken(user._id!, email)

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

    return NextResponse.json({
      user: userResponse,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
