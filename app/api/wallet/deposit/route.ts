import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken, extractTokenFromHeader } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import type { Transaction } from "@/lib/db-types"

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
      return NextResponse.json({ error: "Invalid deposit amount" }, { status: 400 })
    }

    // For demo purposes, we'll allow any deposit amount
    // In production, this would integrate with a payment processor
    const usersCollection = await getCollection("users")
    const transactionsCollection = await getCollection("transactions")

    const now = new Date()
    const userIdObj = new ObjectId(payload.userId)

    // Add to user's balance
    const updateResult = await usersCollection.updateOne(
      { _id: userIdObj },
      {
        $inc: { balance: amount },
        $set: { updatedAt: now },
      },
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Record deposit transaction
    const depositTransaction: Omit<Transaction, "_id"> = {
      userId: userIdObj,
      type: "deposit",
      amount: amount,
      description: `Wallet deposit`,
      createdAt: now,
    }

    await transactionsCollection.insertOne(depositTransaction)

    // Get updated user balance
    const updatedUser = await usersCollection.findOne({ _id: userIdObj })

    return NextResponse.json({
      success: true,
      newBalance: updatedUser?.balance || 0,
    })
  } catch (error) {
    console.error("Deposit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
