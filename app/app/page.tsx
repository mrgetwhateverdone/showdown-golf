"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useMatch } from "@/lib/match"
import { useFriends } from "@/lib/friends"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import { User } from "lucide-react"
import { useEffect } from "react"

export default function AppDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const { matches, publicMatches, refreshMatches, refreshPublicMatches } = useMatch()
  const { refreshFriends } = useFriends()

  useEffect(() => {
    refreshMatches() // Load user's own matches
    refreshPublicMatches() // Load public matches for "Today's Matches" section
    refreshFriends()
  }, [refreshMatches, refreshPublicMatches])

  // Redirect if not logged in
  if (!user) {
    router.push("/")
    return null
  }

  const userMatches = matches.filter(
    (match) =>
      match.players.some((p) => p.id === user.id) &&
      (match.status === "waiting" || match.status === "ready" || match.status === "in-progress"),
  )

  const todaysMatches = publicMatches.filter(
    (match) =>
      match.status === "waiting" &&
      match.players.length < match.maxPlayers &&
      new Date(match.createdAt).toDateString() === new Date().toDateString() &&
      new Date(match.expiresAt) > new Date(), // Also check expiration
  )

  return (
    <div className="p-4 space-y-6 pt-20 pb-20">
      {/* Your Matches Section */}
      <Card className="p-6 bg-white rounded-3xl">
        <h2 className="text-2xl font-bold mb-6">Your Matches</h2>

        {userMatches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-6">No matches found</p>
            <Button
              onClick={() => router.push("/app/create")}
              className="bg-teal-700 hover:bg-teal-800 text-white px-8 py-3 rounded-full"
            >
              Create Your First Match
            </Button>
            <p className="text-sm text-gray-400 mt-4">
              Matches are automatically saved and will persist through page refreshes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userMatches.map((match) => (
              <Card
                key={match.id}
                className="p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100"
                onClick={() => router.push(`/app/match/${match.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{match.course.name}</h3>
                    <p className="text-sm text-gray-600">
                      {match.gameType} • {match.format}
                    </p>
                    <p className="text-sm text-gray-500">
                      {match.players.length}/{match.maxPlayers} players
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${match.wager}</p>
                    <p className="text-sm text-gray-500 capitalize">{match.status}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Today's Matches Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Today's Matches</h2>
          <div className="flex items-center gap-1 text-blue-500">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Kansas City, MO</span>
          </div>
        </div>

        {todaysMatches.length === 0 ? (
          <Card className="p-6 bg-white rounded-3xl text-center">
            <p className="text-gray-500 mb-4">No matches available today</p>
            <Button onClick={() => router.push("/app/browse")} variant="outline" className="mr-2">
              Browse All Matches
            </Button>
            <Button onClick={() => router.push("/app/create")} className="bg-teal-700 hover:bg-teal-800 text-white">
              Create Match
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {todaysMatches.map((match) => {
              const creator = match.players[0]
              const initials = creator.username
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()

              return (
                <Card
                  key={match.id}
                  className="p-4 bg-white rounded-3xl cursor-pointer hover:shadow-md"
                  onClick={() => router.push(`/app/match/${match.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {initials}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg">{creator.username}</h3>
                        <span className="text-sm text-gray-500">Nearby</span>
                      </div>

                      <p className="text-gray-600 text-sm mb-1">
                        {match.gameType} • {match.format}
                      </p>
                      <p className="text-gray-600 text-sm mb-3">Course: {match.course.name}</p>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{new Date(match.createdAt).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">
                            {match.players.length}/{match.maxPlayers} players
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${match.wager}</p>
                          <p className="text-sm text-gray-500 capitalize">{match.gameType}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
