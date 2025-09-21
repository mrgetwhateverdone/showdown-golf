"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth"
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
  searchUsers: (query: string) => Promise<User[]>
  getFriendStats: (userId: string) => FriendStats | null
  refreshFriends: () => void
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined)

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<User[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [friendStats, setFriendStats] = useState<FriendStats[]>([])
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      refreshFriends()
    }
  }, [user])

  const refreshFriends = async () => {
    if (!user) return

    try {
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select(`
          friend_id,
          profiles!friends_friend_id_fkey(
            id,
            email,
            display_name,
            balance,
            handicap,
            created_at
          )
        `)
        .eq("user_id", user.id)

      if (friendsError) {
        console.error("[v0] Error fetching friends:", friendsError)
        return
      }

      const friendsList: User[] =
        friendsData?.map((f) => ({
          id: f.friend_id,
          email: (f.profiles as any)?.email || "",
          username: (f.profiles as any)?.display_name || "Unknown",
          balance: Number((f.profiles as any)?.balance || 0),
          handicap: (f.profiles as any)?.handicap || 0,
          friends: [], // Not needed for friend display
          createdAt: (f.profiles as any)?.created_at || new Date().toISOString(),
        })) || []

      setFriends(friendsList)

      const { data: requestsData, error: requestsError } = await supabase
        .from("friend_requests")
        .select(`
          id,
          from_user_id,
          to_user_id,
          status,
          created_at,
          from_profile:profiles!friend_requests_from_user_id_fkey(display_name),
          to_profile:profiles!friend_requests_to_user_id_fkey(display_name)
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .eq("status", "pending")

      if (requestsError) {
        console.error("[v0] Error fetching friend requests:", requestsError)
        return
      }

      const requestsList: FriendRequest[] =
        requestsData?.map((r) => ({
          id: r.id,
          fromUserId: r.from_user_id,
          fromUsername: (r.from_profile as any)?.display_name || "Unknown",
          toUserId: r.to_user_id,
          toUsername: (r.to_profile as any)?.display_name || "Unknown",
          status: r.status as "pending",
          createdAt: r.created_at,
        })) || []

      setFriendRequests(requestsList)

      await calculateFriendStats()
    } catch (error) {
      console.error("[v0] Error in refreshFriends:", error)
    }
  }

  const calculateFriendStats = async () => {
    if (!user) return

    try {
      // Get all profiles for stats calculation
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, balance, created_at")

      if (!profiles) return

      const stats: FriendStats[] = await Promise.all(
        profiles.map(async (profile) => {
          // Get completed matches where profile is creator
          const { data: createdMatches } = await supabase
            .from("matches")
            .select("id, winner, wager_amount, status")
            .eq("created_by", profile.id)
            .eq("status", "completed")

          // Get completed matches where profile is participant
          const { data: participantMatches } = await supabase
            .from("matches")
            .select(`
              id, 
              winner, 
              wager_amount, 
              status,
              match_participants!inner(user_id)
            `)
            .eq("match_participants.user_id", profile.id)
            .eq("status", "completed")

          // Combine and deduplicate matches
          const allMatches = [...(createdMatches || []), ...(participantMatches || [])]
          const uniqueMatches = Array.from(new Map(allMatches.map((match) => [match.id, match])).values())

          const matchesPlayed = uniqueMatches.length
          const matchesWon = uniqueMatches.filter((m) => m.winner === profile.id).length

          // Calculate total earnings from transactions
          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", profile.id)
            .eq("transaction_type", "winnings")

          const totalEarnings = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

          return {
            userId: profile.id,
            username: profile.display_name || "Unknown",
            matchesPlayed,
            matchesWon,
            totalEarnings,
            averageScore: 0, // Would need more complex calculation from match_scores
            lastActive: profile.created_at, // Mock - would need actual activity tracking
          }
        }),
      )

      setFriendStats(stats)
    } catch (error) {
      console.error("[v0] Error calculating friend stats:", error)
    }
  }

  const sendFriendRequest = async (username: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { data: targetUser, error: userError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("display_name", username)
        .single()

      if (userError || !targetUser || targetUser.id === user.id) return false

      // Check if already friends
      const { data: existingFriend } = await supabase
        .from("friends")
        .select("id")
        .eq("user_id", user.id)
        .eq("friend_id", targetUser.id)
        .single()

      if (existingFriend) return false

      // Check for existing request
      const { data: existingRequest } = await supabase
        .from("friend_requests")
        .select("id")
        .or(
          `and(from_user_id.eq.${user.id},to_user_id.eq.${targetUser.id}),and(from_user_id.eq.${targetUser.id},to_user_id.eq.${user.id})`,
        )
        .eq("status", "pending")
        .single()

      if (existingRequest) return false

      const { error: requestError } = await supabase.from("friend_requests").insert({
        from_user_id: user.id,
        to_user_id: targetUser.id,
        status: "pending",
      })

      if (requestError) return false

      await refreshFriends()
      return true
    } catch (error) {
      console.error("[v0] Error sending friend request:", error)
      return false
    }
  }

  const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { data: request, error: requestError } = await supabase
        .from("friend_requests")
        .select("from_user_id, to_user_id")
        .eq("id", requestId)
        .eq("to_user_id", user.id)
        .single()

      if (requestError || !request) return false

      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)

      if (updateError) return false

      // Create bidirectional friendship
      const { error: friendError } = await supabase.from("friends").insert([
        { user_id: user.id, friend_id: request.from_user_id },
        { user_id: request.from_user_id, friend_id: user.id },
      ])

      if (friendError) return false

      await refreshFriends()
      return true
    } catch (error) {
      console.error("[v0] Error accepting friend request:", error)
      return false
    }
  }

  const declineFriendRequest = async (requestId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("friend_requests").update({ status: "declined" }).eq("id", requestId)

      if (error) return false

      await refreshFriends()
      return true
    } catch (error) {
      console.error("[v0] Error declining friend request:", error)
      return false
    }
  }

  const removeFriend = async (friendId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

      if (error) return false

      await refreshFriends()
      return true
    } catch (error) {
      console.error("[v0] Error removing friend:", error)
      return false
    }
  }

  const searchUsers = async (query: string): Promise<User[]> => {
    if (!query.trim() || !user) return []

    try {
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, balance, handicap, created_at")
        .ilike("display_name", `%${query}%`)
        .neq("id", user.id)
        .limit(10)

      if (error) return []

      // Filter out existing friends
      const friendIds = friends.map((f) => f.id)
      const filteredUsers = users?.filter((u) => !friendIds.includes(u.id)) || []

      return filteredUsers.map((u) => ({
        id: u.id,
        email: u.email || "",
        username: u.display_name || "Unknown",
        balance: Number(u.balance || 0),
        handicap: u.handicap || 0,
        friends: [],
        createdAt: u.created_at || new Date().toISOString(),
      }))
    } catch (error) {
      console.error("[v0] Error searching users:", error)
      return []
    }
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
