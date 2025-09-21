"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export interface User {
  id: string
  email: string
  username: string
  fullName: string
  balance: number
  friends: string[]
  handicap?: number
  homeCourse?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, username: string, fullName: string) => Promise<boolean>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<boolean>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        setSupabaseUser(session.user)
        await fetchUserProfile(session.user.id)
      }
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.id)

      if (session?.user) {
        setSupabaseUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        setSupabaseUser(null)
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("[v0] Error fetching profile:", error)
        return
      }

      if (profile) {
        // Convert database profile to User format
        const userData: User = {
          id: profile.id,
          email: profile.email,
          username: profile.display_name,
          fullName: profile.full_name || profile.display_name,
          balance: Number(profile.balance),
          handicap: profile.handicap || 0,
          homeCourse: profile.home_course,
          friends: [], // Will be populated by friends system
          createdAt: profile.created_at,
        }
        setUser(userData)
      }
    } catch (error) {
      console.error("[v0] Error in fetchUserProfile:", error)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      console.log("[v0] Starting login process", { email })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("[v0] Login error:", error)
        setIsLoading(false)
        return false
      }

      if (data.user) {
        console.log("[v0] Login successful")
        setSupabaseUser(data.user)
        await fetchUserProfile(data.user.id)
        setIsLoading(false)
        return true
      }

      setIsLoading(false)
      return false
    } catch (error) {
      console.error("[v0] Login exception:", error)
      setIsLoading(false)
      return false
    }
  }

  const signup = async (email: string, password: string, username: string, fullName: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      console.log("[v0] Starting signup process", { email, username, fullName })

      const { data: existingUsername } = await supabase
        .from("profiles")
        .select("id")
        .eq("display_name", username)
        .maybeSingle()

      if (existingUsername) {
        console.log("[v0] Username already exists")
        setIsLoading(false)
        return false
      }

      const { data: existingEmail } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle()

      if (existingEmail) {
        console.log("[v0] Email already exists")
        setIsLoading(false)
        return false
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/app`,
          data: {
            display_name: username,
            full_name: fullName,
            handicap: 0,
          },
        },
      })

      if (error) {
        console.error("[v0] Signup error:", error)
        setIsLoading(false)
        return false
      }

      if (data.user) {
        console.log("[v0] Signup successful, user created:", data.user.id)

        if (data.session) {
          console.log("[v0] Session available immediately")
          setSupabaseUser(data.user)
          await fetchUserProfile(data.user.id)
        } else {
          console.log("[v0] No immediate session - auth state handler will manage")
        }

        setIsLoading(false)
        return true
      }

      setIsLoading(false)
      return false
    } catch (error) {
      console.error("[v0] Signup exception:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSupabaseUser(null)
  }

  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    if (!user || !supabaseUser) return false

    try {
      setIsLoading(true)

      // Map User fields to database fields
      const profileUpdates: any = {}
      if (updates.username) profileUpdates.display_name = updates.username
      if (updates.fullName) profileUpdates.full_name = updates.fullName
      if (updates.balance !== undefined) profileUpdates.balance = updates.balance
      if (updates.handicap !== undefined) profileUpdates.handicap = updates.handicap
      if (updates.homeCourse !== undefined) profileUpdates.home_course = updates.homeCourse

      const { error } = await supabase
        .from("profiles")
        .update({
          ...profileUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error("[v0] Error updating profile:", error)
        return false
      }

      // Update local user state
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)

      return true
    } catch (error) {
      console.error("[v0] Error in updateUser:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        login,
        signup,
        logout,
        updateUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
