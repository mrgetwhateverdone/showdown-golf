"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth"
import { useMatch } from "@/lib/match"
import { useToast } from "@/hooks/use-toast"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"

export default function BrowseMatches() {
  const { user } = useAuth()
  const { publicMatches, joinMatch, refreshPublicMatches, isLoadingPublic } = useMatch()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    refreshPublicMatches()
  }, [refreshPublicMatches])

  if (!user) {
    router.push("/")
    return null
  }

  const availableMatches = publicMatches.filter(
    (match) =>
      match.status === "waiting" && match.players.length < match.maxPlayers && new Date(match.expiresAt) > new Date(), // Also filter expired matches
  )

  const handleJoinMatch = async (matchId: string) => {
    const success = await joinMatch(matchId, user.id)
    if (success) {
      toast({
        title: "Joined Match!",
        description: "You've successfully joined the match",
      })
      router.push(`/app/match/${matchId}`)
    } else {
      toast({
        title: "Failed to Join",
        description: "Unable to join this match",
        variant: "destructive",
      })
    }
  }

  if (isLoadingPublic) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-primary mb-6">Browse Matches</h1>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading matches...</span>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-6">Browse Matches</h1>

        {availableMatches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No matches available to join</p>
              <Button onClick={() => router.push("/app/create")}>Create a Match</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableMatches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{match.course.name}</CardTitle>
                    <Badge variant="secondary">{match.gameType}</Badge>
                  </div>
                  <CardDescription>
                    {match.format} • ${match.wager} wager
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Players:</span>
                      <span>
                        {match.players.length}/{match.maxPlayers}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Creator:</span>
                      <span>{match.players[0]?.username}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Expires:</span>
                      <span>{new Date(match.expiresAt).toLocaleDateString()}</span>
                    </div>

                    <Button
                      onClick={() => handleJoinMatch(match.id)}
                      className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      disabled={match.wager > user.balance}
                    >
                      {match.wager > user.balance ? "Insufficient Balance" : "Join Match"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
