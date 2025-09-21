// This ensures consistency across the entire application

export interface User {
  id: string
  email: string
  username: string
  fullName?: string
  balance: number
  friends: string[]
  handicap?: number
  homeCourse?: string
  createdAt: string
}

export interface Match {
  id: string
  creatorId: string
  gameType: GameType
  format: MatchFormat
  course: Course
  wager: number
  maxPlayers: number
  status: MatchStatus
  matchType: MatchType
  handicapType: HandicapType
  wagerType: WagerType
  currentHole: number
  holes: Hole[]
  players: Player[]
  winner?: string
  prizeDistributed?: boolean
  expiresAt: string
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  transactionType: TransactionType
  description: string
  matchId?: string
  createdAt: string
}

export type GameType = "stroke-play" | "match-play" | "skins"
export type MatchFormat = "1v1" | "2v1" | "2v2" | "4-way"
export type MatchStatus = "waiting" | "ready" | "in-progress" | "completed" | "cancelled"
export type MatchType = "public" | "private"
export type HandicapType = "none" | "full" | "partial"
export type WagerType = "winner_takes_all" | "skins" | "match_play"
export type TransactionType = "wager" | "prize" | "refund" | "deposit" | "withdrawal" | "winnings"

export interface Course {
  id: string
  name: string
  location: string
  holes: number
  par: number[]
}

export interface Player {
  id: string
  username: string
  ready: boolean
}

export interface Hole {
  number: number
  par: number
  completed: boolean
  scores: { [playerId: string]: { strokes: number; confirmed: boolean } }
}

export interface Team {
  id: string
  name: string
  color: string
  playerIds: string[]
}

export interface FriendRequest {
  id: string
  fromUserId: string
  fromUsername: string
  toUserId: string
  toUsername: string
  status: "pending" | "accepted" | "declined"
  createdAt: string
}

export interface FriendStats {
  userId: string
  username: string
  matchesPlayed: number
  matchesWon: number
  totalEarnings: number
  averageScore: number
  lastActive: string
}

export interface WalletStats {
  totalDeposits: number
  totalWithdrawals: number
  totalWagers: number
  totalWinnings: number
  netProfit: number
  matchesPlayed: number
  matchesWon: number
  winRate: number
}
