"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface User {
  id: string
  email: string
  username: string
  balance: number
  friends: string[]
  handicap?: string
  homeCourse?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, username: string) => Promise<boolean>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem("golf-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const updateUser = (updates: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem("golf-user", JSON.stringify(updatedUser))

    // Also update in the users array
    const users = JSON.parse(localStorage.getItem("golf-users") || "[]")
    const userIndex = users.findIndex((u: User) => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex] = updatedUser
      localStorage.setItem("golf-users", JSON.stringify(users))
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if user exists in localStorage users
    const users = JSON.parse(localStorage.getItem("golf-users") || "[]")
    const existingUser = users.find((u: User) => u.email === email)

    if (existingUser) {
      setUser(existingUser)
      localStorage.setItem("golf-user", JSON.stringify(existingUser))
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const signup = async (email: string, password: string, username: string): Promise<boolean> => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem("golf-users") || "[]")
    const existingUser = users.find((u: User) => u.email === email || u.username === username)

    if (existingUser) {
      setIsLoading(false)
      return false
    }

    // Create new user with $1,000 starting balance
    const newUser: User = {
      id: Date.now().toString(),
      email,
      username,
      balance: 1000, // Free $1,000 starting balance
      friends: [],
      createdAt: new Date().toISOString(),
    }

    // Save to users array
    users.push(newUser)
    localStorage.setItem("golf-users", JSON.stringify(users))

    // Set as current user
    setUser(newUser)
    localStorage.setItem("golf-user", JSON.stringify(newUser))

    setIsLoading(false)
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("golf-user")
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
