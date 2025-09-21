"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./auth"

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

interface FriendsContextType {
  friends: User[]
  friendRequests: FriendRequest[]
  friendStats: FriendStats[]
  sendFriendRequest: (username: string) => Promise<boolean>
  acceptFriendRequest: (requestId: string) => Promise<boolean>
  declineFriendRequest: (requestId: string) => Promise<boolean>
  removeFriend: (friendId: string) => Promise<boolean>
  searchUsers: (query: string) => User[]
  getFriendStats: (userId: string) => FriendStats | null
  refreshFriends: () => void
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined)

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<User[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [friendStats, setFriendStats] = useState<FriendStats[]>([])

  useEffect(() => {
    refreshFriends()
  }, [])

  const refreshFriends = () => {
    const currentUser = JSON.parse(localStorage.getItem("golf-user") || "null")
    if (!currentUser) return

    const allUsers = JSON.parse(localStorage.getItem("golf-users") || "[]")

    const userFriends = allUsers.filter(
      (user: User) => currentUser.friends.includes(user.id) && user.id !== currentUser.id,
    )
    setFriends(userFriends)

    const allRequests = JSON.parse(localStorage.getItem("golf-friend-requests") || "[]")
    const userRequests = allRequests.filter(
      (req: FriendRequest) => req.toUserId === currentUser.id || req.fromUserId === currentUser.id,
    )
    setFriendRequests(userRequests)

    const matches = JSON.parse(localStorage.getItem("golf-matches") || "[]")
    const stats = allUsers.map((user: User) => {
      const userMatches = matches.filter(
        (match: any) => match.players.some((p: any) => p.id === user.id) && match.status === "completed",
      )

      const matchesWon = userMatches.filter((match: any) => match.winner === user.id).length
      const totalStrokes = userMatches.reduce((sum: number, match: any) => {
        const playerHoles = match.holes.filter((hole: any) =>
          hole.scores.some((score: any) => score.playerId === user.id),
        )
        const playerStrokes = playerHoles.reduce((holeSum: number, hole: any) => {
          const score = hole.scores.find((s: any) => s.playerId === user.id)
          return holeSum + (score?.strokes || 0)
        }, 0)
        return sum + playerStrokes
      }, 0)

      return {
        userId: user.id,
        username: user.username,
        matchesPlayed: userMatches.length,
        matchesWon,
        totalEarnings: user.balance - 1000, // Subtract starting balance
        averageScore: userMatches.length > 0 ? Math.round(totalStrokes / (userMatches.length * 18)) : 0,
        lastActive: new Date().toISOString(), // Mock last active
      }
    })

    setFriendStats(stats)
  }

  const sendFriendRequest = async (username: string): Promise<boolean> => {
    const currentUser = JSON.parse(localStorage.getItem("golf-user") || "null")
    if (!currentUser) return false

    const allUsers = JSON.parse(localStorage.getItem("golf-users") || "[]")
    const targetUser = allUsers.find((user: User) => user.username === username)

    if (!targetUser || targetUser.id === currentUser.id) return false

    if (currentUser.friends.includes(targetUser.id)) return false

    const existingRequests = JSON.parse(localStorage.getItem("golf-friend-requests") || "[]")
    const existingRequest = existingRequests.find(
      (req: FriendRequest) =>
        (req.fromUserId === currentUser.id && req.toUserId === targetUser.id) ||
        (req.fromUserId === targetUser.id && req.toUserId === currentUser.id),
    )

    if (existingRequest) return false

    const newRequest: FriendRequest = {
      id: Date.now().toString(),
      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      toUserId: targetUser.id,
      toUsername: targetUser.username,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    const updatedRequests = [...existingRequests, newRequest]
    localStorage.setItem("golf-friend-requests", JSON.stringify(updatedRequests))

    refreshFriends()
    return true
  }

  const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
    const currentUser = JSON.parse(localStorage.getItem("golf-user") || "null")
    if (!currentUser) return false

    const allRequests = JSON.parse(localStorage.getItem("golf-friend-requests") || "[]")
    const request = allRequests.find((req: FriendRequest) => req.id === requestId)

    if (!request || request.toUserId !== currentUser.id) return false

    const updatedRequests = allRequests.map((req: FriendRequest) =>
      req.id === requestId ? { ...req, status: "accepted" as const } : req,
    )
    localStorage.setItem("golf-friend-requests", JSON.stringify(updatedRequests))

    const allUsers = JSON.parse(localStorage.getItem("golf-users") || "[]")
    const updatedUsers = allUsers.map((user: User) => {
      if (user.id === currentUser.id) {
        return { ...user, friends: [...user.friends, request.fromUserId] }
      }
      if (user.id === request.fromUserId) {
        return { ...user, friends: [...user.friends, currentUser.id] }
      }
      return user
    })

    localStorage.setItem("golf-users", JSON.stringify(updatedUsers))

    const updatedCurrentUser = { ...currentUser, friends: [...currentUser.friends, request.fromUserId] }
    localStorage.setItem("golf-user", JSON.stringify(updatedCurrentUser))

    refreshFriends()
    return true
  }

  const declineFriendRequest = async (requestId: string): Promise<boolean> => {
    const allRequests = JSON.parse(localStorage.getItem("golf-friend-requests") || "[]")
    const updatedRequests = allRequests.map((req: FriendRequest) =>
      req.id === requestId ? { ...req, status: "declined" as const } : req,
    )
    localStorage.setItem("golf-friend-requests", JSON.stringify(updatedRequests))

    refreshFriends()
    return true
  }

  const removeFriend = async (friendId: string): Promise<boolean> => {
    const currentUser = JSON.parse(localStorage.getItem("golf-user") || "null")
    if (!currentUser) return false

    const allUsers = JSON.parse(localStorage.getItem("golf-users") || "[]")
    const updatedUsers = allUsers.map((user: User) => {
      if (user.id === currentUser.id) {
        return { ...user, friends: user.friends.filter((id) => id !== friendId) }
      }
      if (user.id === friendId) {
        return { ...user, friends: user.friends.filter((id) => id !== currentUser.id) }
      }
      return user
    })

    localStorage.setItem("golf-users", JSON.stringify(updatedUsers))

    const updatedCurrentUser = { ...currentUser, friends: currentUser.friends.filter((id: string) => id !== friendId) }
    localStorage.setItem("golf-user", JSON.stringify(updatedCurrentUser))

    refreshFriends()
    return true
  }

  const searchUsers = (query: string): User[] => {
    if (!query.trim()) return []

    const allUsers = JSON.parse(localStorage.getItem("golf-users") || "[]")
    const currentUser = JSON.parse(localStorage.getItem("golf-user") || "null")

    return allUsers
      .filter(
        (user: User) =>
          user.username.toLowerCase().includes(query.toLowerCase()) &&
          user.id !== currentUser?.id &&
          !currentUser?.friends.includes(user.id),
      )
      .slice(0, 10) // Limit to 10 results
  }

  const getFriendStats = (userId: string): FriendStats | null => {
    return friendStats.find((stats) => stats.userId === userId) || null
  }

  return (
    <FriendsContext.Provider
      value={{
        friends,
        friendRequests,
        friendStats,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        searchUsers,
        getFriendStats,
        refreshFriends,
      }}
    >
      {children}
    </FriendsContext.Provider>
  )
}

export function useFriends() {
  const context = useContext(FriendsContext)
  if (context === undefined) {
    throw new Error("useFriends must be used within a FriendsProvider")
  }
  return context
}
