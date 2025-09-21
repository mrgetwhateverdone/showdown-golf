import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken, extractTokenFromHeader } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import type { Transaction } from "@/lib/db-types"

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

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const transactionsCollection = await getCollection("transactions")

    // Get user's transactions
    const transactions = (await transactionsCollection
      .find({ userId: new ObjectId(payload.userId) })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()) as Transaction[]

    const formattedTransactions = transactions.map((transaction) => ({
      ...transaction,
      _id: transaction._id!.toString(),
      userId: transaction.userId.toString(),
      matchId: transaction.matchId?.toString(),
    }))

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error) {
    console.error("Get transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
