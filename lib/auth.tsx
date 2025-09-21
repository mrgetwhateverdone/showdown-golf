"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface User {
  id: string
  email: string
  username: string
  balance: number
  friends: string[]
  handicap?: number
  homeCourse?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, username: string) => Promise<boolean>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<boolean>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USERS_KEY = "golf-users"
const CURRENT_USER_KEY = "golf-user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem(CURRENT_USER_KEY)
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Failed to parse saved user:", error)
        localStorage.removeItem(CURRENT_USER_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const getStoredUsers = (): User[] => {
    try {
      const users = localStorage.getItem(DEMO_USERS_KEY)
      return users ? JSON.parse(users) : []
    } catch {
      return []
    }
  }

  const saveStoredUsers = (users: User[]) => {
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users))
  }

  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false

    try {
      setIsLoading(true)
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser))

      // Update in stored users as well
      const users = getStoredUsers()
      const userIndex = users.findIndex((u) => u.id === user.id)
      if (userIndex >= 0) {
        users[userIndex] = updatedUser
        saveStoredUsers(users)
      }

      return true
    } catch (error) {
      console.error("Failed to update user:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      console.log("[v0] Starting login process", { email })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const users = getStoredUsers()
      const foundUser = users.find((u) => u.email === email)

      if (foundUser) {
        console.log("[v0] User found, logging in")
        setUser(foundUser)
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser))
        setIsLoading(false)
        return true
      }

      console.log("[v0] User not found")
      setIsLoading(false)
      return false
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      return false
    }
  }

  const signup = async (email: string, password: string, username: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      console.log("[v0] Starting signup process", { email, username })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const users = getStoredUsers()

      // Check if user already exists
      const existingUser = users.find((u) => u.email === email || u.username === username)
      if (existingUser) {
        console.log("[v0] User already exists")
        setIsLoading(false)
        return false
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        username,
        balance: 1000,
        handicap: 0,
        friends: [],
        createdAt: new Date().toISOString(),
      }

      console.log("[v0] Creating new user:", newUser)

      // Save to storage
      users.push(newUser)
      saveStoredUsers(users)

      // Set as current user
      setUser(newUser)
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser))

      setIsLoading(false)
      return true
    } catch (error) {
      console.error("Signup error:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(CURRENT_USER_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
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
