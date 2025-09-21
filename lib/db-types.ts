import type { ObjectId } from "mongodb"

// User types
export interface User {
  _id?: ObjectId
  email: string
  displayName: string
  passwordHash: string
  balance: number
  handicap: number
  friends: ObjectId[]
  createdAt: Date
  updatedAt: Date
}

// Match types
export interface Match {
  _id?: ObjectId
  hostId: ObjectId
  participants: ObjectId[]
  gameType: "stroke-play" | "match-play" | "skins"
  betAmount: number
  status: "waiting" | "in-progress" | "completed" | "cancelled"
  currentHole: number
  scores: { [userId: string]: number[] }
  course: {
    name: string
    holes: Array<{
      number: number
      par: number
      yardage: number
    }>
  }
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// Friend request types
export interface FriendRequest {
  _id?: ObjectId
  fromUserId: ObjectId
  toUserId: ObjectId
  status: "pending" | "accepted" | "declined"
  createdAt: Date
  updatedAt: Date
}

// Transaction types
export interface Transaction {
  _id?: ObjectId
  userId: ObjectId
  matchId?: ObjectId
  type: "match-win" | "match-loss" | "deposit" | "withdrawal"
  amount: number
  description: string
  createdAt: Date
}
