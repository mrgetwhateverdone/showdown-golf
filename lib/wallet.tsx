"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth"

export interface Transaction {
  id: string
  userId: string
  amount: number
  transactionType: "deposit" | "withdrawal" | "wager" | "winnings" | "refund"
  description: string
  matchId?: string
  createdAt: string
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

interface WalletContextType {
  balance: number
  transactions: Transaction[]
  stats: WalletStats
  addFunds: (amount: number) => Promise<boolean>
  withdrawFunds: (amount: number) => Promise<boolean>
  getTransactionHistory: (limit?: number) => Promise<Transaction[]>
  refreshWallet: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<WalletStats>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalWagers: 0,
    totalWinnings: 0,
    netProfit: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    winRate: 0,
  })
  const { user, updateUser } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      setBalance(user.balance)
      refreshWallet()
    }
  }, [user])

  const refreshWallet = async () => {
    if (!user) return

    try {
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (transactionsError) {
        console.error("[v0] Error fetching transactions:", transactionsError)
        return
      }

      const transformedTransactions: Transaction[] =
        transactionsData?.map((t) => ({
          id: t.id,
          userId: t.user_id,
          amount: Number(t.amount),
          transactionType: t.transaction_type,
          description: t.description || "",
          matchId: t.match_id || undefined,
          createdAt: t.created_at,
        })) || []

      setTransactions(transformedTransactions)

      const deposits = transformedTransactions
        .filter((t) => t.transactionType === "deposit")
        .reduce((sum, t) => sum + t.amount, 0)

      const withdrawals = transformedTransactions
        .filter((t) => t.transactionType === "withdrawal")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      const wagers = transformedTransactions
        .filter((t) => t.transactionType === "wager")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      const winnings = transformedTransactions
        .filter((t) => t.transactionType === "winnings")
        .reduce((sum, t) => sum + t.amount, 0)

      // Get matches where user is creator
      const { data: createdMatches } = await supabase
        .from("matches")
        .select("id, winner, status")
        .eq("created_by", user.id)
        .eq("status", "completed")

      // Get matches where user is participant
      const { data: participantMatches } = await supabase
        .from("matches")
        .select(`
          id, 
          winner, 
          status,
          match_participants!inner(user_id)
        `)
        .eq("match_participants.user_id", user.id)
        .eq("status", "completed")

      // Combine and deduplicate matches
      const allMatches = [...(createdMatches || []), ...(participantMatches || [])]
      const uniqueMatches = Array.from(new Map(allMatches.map((match) => [match.id, match])).values())

      const matchesPlayed = uniqueMatches.length
      const matchesWon = uniqueMatches.filter((m) => m.winner === user.id).length
      const winRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0

      setStats({
        totalDeposits: deposits,
        totalWithdrawals: withdrawals,
        totalWagers: wagers,
        totalWinnings: winnings,
        netProfit: winnings - wagers,
        matchesPlayed,
        matchesWon,
        winRate,
      })
    } catch (error) {
      console.error("[v0] Error in refreshWallet:", error)
    }
  }

  const addFunds = async (amount: number): Promise<boolean> => {
    if (!user || amount <= 0) return false

    try {
      const newBalance = user.balance + amount

      const { error: balanceError } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)

      if (balanceError) {
        console.error("[v0] Error updating balance:", balanceError)
        return false
      }

      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: user.id,
        amount: amount,
        transaction_type: "deposit",
        description: `Funds added to wallet`,
      })

      if (transactionError) {
        console.error("[v0] Error recording transaction:", transactionError)
        return false
      }

      // Update local state
      await updateUser({ balance: newBalance })
      setBalance(newBalance)
      await refreshWallet()

      return true
    } catch (error) {
      console.error("[v0] Error adding funds:", error)
      return false
    }
  }

  const withdrawFunds = async (amount: number): Promise<boolean> => {
    if (!user || amount <= 0 || amount > user.balance) return false

    try {
      const newBalance = user.balance - amount

      const { error: balanceError } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)

      if (balanceError) {
        console.error("[v0] Error updating balance:", balanceError)
        return false
      }

      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: user.id,
        amount: -amount,
        transaction_type: "withdrawal",
        description: `Funds withdrawn from wallet`,
      })

      if (transactionError) {
        console.error("[v0] Error recording transaction:", transactionError)
        return false
      }

      // Update local state
      await updateUser({ balance: newBalance })
      setBalance(newBalance)
      await refreshWallet()

      return true
    } catch (error) {
      console.error("[v0] Error withdrawing funds:", error)
      return false
    }
  }

  const getTransactionHistory = async (limit = 50): Promise<Transaction[]> => {
    if (!user) return []

    try {
      const { data: transactionsData, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("[v0] Error fetching transaction history:", error)
        return []
      }

      return (
        transactionsData?.map((t) => ({
          id: t.id,
          userId: t.user_id,
          amount: Number(t.amount),
          transactionType: t.transaction_type,
          description: t.description || "",
          matchId: t.match_id || undefined,
          createdAt: t.created_at,
        })) || []
      )
    } catch (error) {
      console.error("[v0] Error in getTransactionHistory:", error)
      return []
    }
  }

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        stats,
        addFunds,
        withdrawFunds,
        getTransactionHistory,
        refreshWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
