import type { ObjectId } from "mongodb"

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

export interface Match {
  _id?: ObjectId
  title: string
  description: string
  courseId: string
  courseName: string
  gameType: "stroke-play" | "match-play" | "skins"
  betAmount: number
  maxPlayers: number
  players: ObjectId[]
  status: "open" | "in-progress" | "completed" | "cancelled"
  startTime: Date
  scores?: { [playerId: string]: number[] }
  winner?: ObjectId
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  _id?: ObjectId
  userId: ObjectId
  type: "deposit" | "withdrawal" | "bet" | "winnings"
  amount: number
  description: string
  matchId?: ObjectId
  status: "pending" | "completed" | "failed"
  createdAt: Date
}
