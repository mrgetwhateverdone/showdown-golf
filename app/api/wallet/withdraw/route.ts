import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken, extractTokenFromHeader } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import type { Transaction, User } from "@/lib/db-types"

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

    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 })
    }

    const usersCollection = await getCollection("users")
    const transactionsCollection = await getCollection("transactions")

    const userIdObj = new ObjectId(payload.userId)

    // Check user's current balance
    const user = (await usersCollection.findOne({ _id: userIdObj })) as User | null

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    const now = new Date()

    // Deduct from user's balance
    await usersCollection.updateOne(
      { _id: userIdObj },
      {
        $inc: { balance: -amount },
        $set: { updatedAt: now },
      },
    )

    // Record withdrawal transaction
    const withdrawalTransaction: Omit<Transaction, "_id"> = {
      userId: userIdObj,
      type: "withdrawal",
      amount: -amount,
      description: `Wallet withdrawal`,
      createdAt: now,
    }

    await transactionsCollection.insertOne(withdrawalTransaction)

    // Get updated user balance
    const updatedUser = await usersCollection.findOne({ _id: userIdObj })

    return NextResponse.json({
      success: true,
      newBalance: updatedUser?.balance || 0,
    })
  } catch (error) {
    console.error("Withdrawal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
