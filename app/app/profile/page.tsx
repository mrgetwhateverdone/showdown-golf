"use client"

import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronRight, MapPin, Target, Users } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useMatch } from "@/lib/match"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FriendsModal } from "@/components/friends-modal"
import { CourseSelectionModal } from "@/components/course-selection-modal"
import { HandicapModal } from "@/components/handicap-modal"

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const { matches } = useMatch()
  const router = useRouter()
  const [showFriendsModal, setShowFriendsModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showHandicapModal, setShowHandicapModal] = useState(false)

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const calculateUserStats = () => {
    if (!user) return { winLoss: "0-0", totalEarnings: "$0", currentStreak: "0", handicap: "Not Set" }

    // Filter completed matches where user participated (excluding bot matches)
    const userMatches = matches.filter(
      (match) =>
        match.status === "completed" &&
        match.players.some((p) => p.id === user.id) &&
        !match.players.some((p) => p.id === "bot-player"),
    )

    let wins = 0
    let losses = 0
    let currentStreak = 0
    let streakType: "win" | "loss" | null = null

    // Calculate wins/losses and current streak
    userMatches
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((match) => {
        const isWinner = match.winner === user.id

        if (isWinner) {
          wins++
          if (streakType === "win" || streakType === null) {
            currentStreak = streakType === "win" ? currentStreak + 1 : 1
            streakType = "win"
          } else {
            currentStreak = 1
            streakType = "win"
          }
        } else {
          losses++
          if (streakType === "loss" || streakType === null) {
            currentStreak = streakType === "loss" ? currentStreak + 1 : 1
            streakType = "loss"
          } else {
            currentStreak = 1
            streakType = "loss"
          }
        }
      })

    const streakDisplay = currentStreak > 0 ? `${currentStreak}${streakType === "win" ? "W" : "L"}` : "0"

    return {
      winLoss: `${wins}-${losses}`,
      totalEarnings: `$${user.balance || 0}`,
      currentStreak: streakDisplay,
      handicap: user.handicap || "Not Set",
    }
  }

  const userStats = calculateUserStats()

  const handleLogout = async () => {
    try {
      console.log("[v0] Saving user data before logout:", user)

      // Ensure all user data is saved to database
      if (user) {
        await updateUser({
          username: user.username,
          fullName: user.fullName,
          balance: user.balance,
          handicap: user.handicap,
          homeCourse: user.homeCourse,
        })
        console.log("[v0] User data saved successfully before logout")
      }

      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log("[v0] Logging out user")
      await logout()
      router.push("/")
    } catch (error) {
      console.error("[v0] Error during logout:", error)
      // Still logout even if save fails
      await logout()
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader />

      <div className="px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="text-center space-y-4">
          <Avatar className="w-24 h-24 mx-auto bg-teal-500">
            <AvatarFallback className="text-white text-2xl font-semibold">
              {user?.username ? getUserInitials(user.username) : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.username || "User"}</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="space-y-3">
          {/* Friends */}
          <Card>
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-0 h-auto"
                onClick={() => setShowFriendsModal(true)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Friends</h3>
                    <p className="text-sm text-gray-600">
                      {user?.friends?.length || 0} friends • Manage your golf network
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Button>
            </CardContent>
          </Card>

          {/* Change Home Course */}
          <Card>
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-0 h-auto"
                onClick={() => setShowCourseModal(true)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Change Home Course</h3>
                    <p className="text-sm text-gray-600">Currently: {user?.homeCourse || "Not Set"}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Button>
            </CardContent>
          </Card>

          {/* Change Handicap */}
          <Card>
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-between text-left p-0 h-auto"
                onClick={() => setShowHandicapModal(true)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Change Handicap</h3>
                    <p className="text-sm text-gray-600">Currently: {userStats.handicap}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Your Stats */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Your Stats</h2>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{userStats.winLoss}</div>
                <div className="text-sm text-gray-600">Win-Loss</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{userStats.totalEarnings}</div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{userStats.currentStreak}</div>
                <div className="text-sm text-gray-600">Current Streak</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{userStats.handicap}</div>
                <div className="text-sm text-gray-600">Handicap</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-8">
          <button
            className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 py-4 transition-colors"
            onClick={handleLogout}
          >
            <span className="text-base font-medium">Logout</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </button>
        </div>
      </div>

      <BottomNav />

      {/* Modals */}
      <FriendsModal isOpen={showFriendsModal} onClose={() => setShowFriendsModal(false)} />
      <CourseSelectionModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onSelect={(course) => {
          updateUser({ homeCourse: course })
          setShowCourseModal(false)
        }}
      />
      <HandicapModal isOpen={showHandicapModal} onClose={() => setShowHandicapModal(false)} />
    </div>
  )
}
