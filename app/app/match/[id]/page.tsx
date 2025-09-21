"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth"
import { useMatch, type Match } from "@/lib/match"
import { useToast } from "@/hooks/use-toast"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react"

interface GolfScore {
  strokes: number
  putts?: number
  fairwayHit?: boolean
  greenInRegulation?: boolean
  chipShots?: number
  greensideSandShots?: number
}

export default function MatchPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const { getMatch, startMatch, submitScore, confirmScore, refreshMatches } = useMatch()
  const router = useRouter()
  const { toast } = useToast()

  const [match, setMatch] = useState<Match | null>(null)
  const [golfScore, setGolfScore] = useState<GolfScore>({
    strokes: 0,
    putts: undefined,
    fairwayHit: undefined,
    greenInRegulation: undefined,
    chipShots: undefined,
    greensideSandShots: undefined,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const foundMatch = getMatch(params.id)
    setMatch(foundMatch)

    if (!foundMatch) {
      toast({
        title: "Match Not Found",
        description: "This match doesn't exist or has expired",
        variant: "destructive",
      })
      router.push("/app")
    }
  }, [params.id, getMatch, router, toast])

  useEffect(() => {
    // Refresh match data every 3 seconds for real-time updates
    const interval = setInterval(() => {
      refreshMatches()
      const updatedMatch = getMatch(params.id)
      setMatch(updatedMatch)
    }, 3000)

    return () => clearInterval(interval)
  }, [params.id, getMatch, refreshMatches])

  const handleStartMatch = async () => {
    const success = await startMatch(match.id, user.id)
    if (success) {
      toast({
        title: "Ready!",
        description: match.players.every((p) => p.ready) ? "Match started!" : "Waiting for other players...",
      })
    }
  }

  const handleSubmitScore = async () => {
    if (golfScore.strokes < 1 || golfScore.strokes > 15) {
      toast({
        title: "Invalid Score",
        description: "Please select a valid number of strokes (1-15)",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const success = await submitScore(match.id, user.id, match.currentHole, golfScore.strokes)

    if (success) {
      toast({
        title: "Score Submitted",
        description: `${golfScore.strokes} strokes recorded for hole ${match.currentHole}`,
      })
      // Reset scoring state
      setGolfScore({
        strokes: 0,
        putts: undefined,
        fairwayHit: undefined,
        greenInRegulation: undefined,
        chipShots: undefined,
        greensideSandShots: undefined,
      })
    }

    setIsSubmitting(false)
  }

  const handleConfirmScores = async () => {
    const success = await confirmScore(match.id, user.id, match.currentHole)
    if (success) {
      if (match.gameType === "stroke-play") {
        toast({
          title: "Score Confirmed",
          description: allScoresConfirmed ? "Moving to next hole!" : "Waiting for other players to confirm...",
        })
      } else {
        toast({
          title: "Scores Confirmed",
          description: allScoresConfirmed ? "Moving to next hole!" : "Waiting for other players to confirm...",
        })
      }
    }
  }

  const calculateCurrentStandings = () => {
    if (match.gameType === "stroke-play") {
      return match.players
        .map((player) => {
          const totalStrokes = match.holes.slice(0, match.currentHole - 1).reduce((sum, hole) => {
            const score = hole.scores.find((s) => s.playerId === player.id)
            return sum + (score?.strokes || 0)
          }, 0)
          return { player, score: totalStrokes }
        })
        .sort((a, b) => a.score - b.score)
    }

    if (match.gameType === "match-play") {
      return match.players
        .map((player) => {
          const holesWon = match.holes.slice(0, match.currentHole - 1).filter((hole) => {
            const playerScore = hole.scores.find((s) => s.playerId === player.id)?.strokes || 999
            const opponentScores = hole.scores.filter((s) => s.playerId !== player.id).map((s) => s.strokes)
            const bestOpponent = Math.min(...opponentScores, 999)
            return playerScore < bestOpponent
          }).length
          return { player, score: holesWon }
        })
        .sort((a, b) => b.score - a.score)
    }

    if (match.gameType === "skins") {
      return match.players
        .map((player) => {
          const skinsWon = match.holes.slice(0, match.currentHole - 1).filter((hole) => {
            const playerScore = hole.scores.find((s) => s.playerId === player.id)?.strokes || 999
            const allScores = hole.scores.map((s) => s.strokes)
            const minScore = Math.min(...allScores)
            const minCount = allScores.filter((s) => s === minScore).length
            return playerScore === minScore && minCount === 1
          }).length
          return { player, score: skinsWon }
        })
        .sort((a, b) => b.score - a.score)
    }

    return []
  }

  if (!user || !match) {
    return null
  }

  const isPlayerInMatch = match.players.some((p) => p.id === user.id)
  const currentPlayer = match.players.find((p) => p.id === user.id)
  const currentHole = match.holes[match.currentHole - 1]
  const playerScore = currentHole?.scores.find((s) => s.playerId === user.id)
  const allScoresSubmitted = currentHole?.scores.length === match.players.length
  const allScoresConfirmed = currentHole?.scores.every((s) => s.confirmed)

  if (!isPlayerInMatch) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">You are not part of this match</p>
              <Button onClick={() => router.push("/app")}>Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (match.status === "waiting") {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <AppHeader />

        <div className="p-4 flex justify-center">
          <div className="w-full max-w-md">
            <Card className="bg-gray-100 border-0 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">{match.course.name}</h2>
                  <p className="text-sm text-gray-600">
                    {match.gameType} • {match.format} • ${match.wager} wager
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">
                    Players ({match.players.length}/{match.maxPlayers})
                  </h3>

                  <div className="space-y-2">
                    {match.players.map((player) => (
                      <div key={player.id} className="flex justify-between items-center">
                        <span className="text-gray-900">{player.username}</span>
                        <Badge
                          variant={player.ready ? "default" : "secondary"}
                          className={
                            player.ready
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                          }
                        >
                          {player.ready ? "Ready" : "Not Ready"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {match.players.length === match.maxPlayers ? (
                  <Button
                    onClick={handleStartMatch}
                    disabled={currentPlayer?.ready}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white rounded-full py-3"
                  >
                    {currentPlayer?.ready ? "Waiting for other players..." : "Ready to Start"}
                  </Button>
                ) : (
                  <div className="text-center text-gray-500 py-4">Waiting for more players to join...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (match.status === "completed") {
    const winner = match.players.find((p) => p.id === match.winner)
    const totalPrize = match.wager * match.players.length

    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader />

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-primary">
                {winner?.username === "Golf Bot" ? "Bot Wins!" : `${winner?.username} Wins!`}
              </CardTitle>
              <CardDescription>
                {match.course.name} • {match.gameType}
              </CardDescription>
              {match.wager > 0 && (
                <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
                  <p className="text-lg font-semibold text-secondary">Prize: ${totalPrize}</p>
                  <p className="text-sm text-muted-foreground">
                    {match.gameType === "skins" ? "Distributed per skin won" : "Winner takes all"}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-semibold">Final Standings</h3>
                {calculateCurrentStandings().map((standing, index) => (
                  <div key={standing.player.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <span>{standing.player.username}</span>
                    </div>
                    <span className="font-semibold">
                      {match.gameType === "stroke-play"
                        ? `${standing.score} strokes`
                        : match.gameType === "match-play"
                          ? `${standing.score} holes`
                          : `${standing.score} skins`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (match.status === "in-progress") {
    const progress = ((match.currentHole - 1) / 18) * 100
    const standings = calculateCurrentStandings()

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <AppHeader />

        <div className="p-4 space-y-4">
          {/* Course Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{match.course.name}</h1>
            <p className="text-gray-600">
              {match.gameType} • ${match.wager}/hole
            </p>
          </div>

          {/* Hole Info */}
          <Card className="bg-white border-0 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Hole {match.currentHole} <span className="text-green-600">Par {currentHole?.par}</span>
                  </h2>
                  <p className="text-gray-600 text-sm">395 yards</p>
                </div>
                <div className="text-right text-gray-600">
                  <p className="text-sm">Progress: {match.currentHole}/18</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                </div>
                <span>Straight away with bunkers left</span>
              </div>
            </CardContent>
          </Card>

          {/* Players */}
          <div className="grid grid-cols-2 gap-3">
            {match.players.map((player) => {
              const score = currentHole?.scores.find((s) => s.playerId === player.id)
              const totalScore = match.holes.slice(0, match.currentHole - 1).reduce((sum, hole) => {
                const holeScore = hole.scores.find((s) => s.playerId === player.id)
                return sum + (holeScore?.strokes || 0)
              }, 0)

              return (
                <Card key={player.id} className="bg-white border-0 rounded-2xl shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          player.id === user.id ? "bg-teal-600" : "bg-orange-500"
                        }`}
                      >
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{player.username}</p>
                        {player.id === user.id && <p className="text-xs text-gray-500">You</p>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Total: {totalScore} through {match.currentHole - 1}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Score Entry - Only show if player hasn't submitted score yet */}
          {!playerScore && (
            <>
              {/* Score Selection */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Score</h3>
                  <span className="text-green-600 font-medium">Par {currentHole?.par}</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((score) => (
                    <Button
                      key={score}
                      variant={golfScore.strokes === score ? "default" : "outline"}
                      className={`h-16 text-xl font-semibold rounded-2xl ${
                        golfScore.strokes === score
                          ? "bg-teal-600 hover:bg-teal-700 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
                      }`}
                      onClick={() => setGolfScore((prev) => ({ ...prev, strokes: score }))}
                    >
                      {score}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Putts */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Putts</h3>
                <div className="flex gap-3">
                  {[0, 1, 2, 3, "≥4"].map((putts) => (
                    <Button
                      key={putts}
                      variant={golfScore.putts === putts ? "default" : "outline"}
                      className={`flex-1 h-12 rounded-2xl ${
                        golfScore.putts === putts
                          ? "bg-teal-600 hover:bg-teal-700 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
                      }`}
                      onClick={() => setGolfScore((prev) => ({ ...prev, putts: putts }))}
                    >
                      {putts}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Fairway Hit */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Fairway Hit</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={golfScore.fairwayHit === true ? "default" : "outline"}
                    className={`h-12 rounded-2xl ${
                      golfScore.fairwayHit === true
                        ? "bg-teal-600 hover:bg-teal-700 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
                    }`}
                    onClick={() => setGolfScore((prev) => ({ ...prev, fairwayHit: true }))}
                  >
                    <Check className="w-5 h-5" />
                  </Button>
                  <Button
                    variant={golfScore.fairwayHit === false ? "default" : "outline"}
                    className={`h-12 rounded-2xl ${
                      golfScore.fairwayHit === false
                        ? "bg-teal-600 hover:bg-teal-700 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
                    }`}
                    onClick={() => setGolfScore((prev) => ({ ...prev, fairwayHit: false }))}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Green in Regulation */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Green in Regulation</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={golfScore.greenInRegulation === true ? "default" : "outline"}
                    className={`h-12 rounded-2xl ${
                      golfScore.greenInRegulation === true
                        ? "bg-teal-600 hover:bg-teal-700 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
                    }`}
                    onClick={() => setGolfScore((prev) => ({ ...prev, greenInRegulation: true }))}
                  >
                    <Check className="w-5 h-5" />
                  </Button>
                  <Button
                    variant={golfScore.greenInRegulation === false ? "default" : "outline"}
                    className={`h-12 rounded-2xl ${
                      golfScore.greenInRegulation === false
                        ? "bg-teal-600 hover:bg-teal-700 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
                    }`}
                    onClick={() => setGolfScore((prev) => ({ ...prev, greenInRegulation: false }))}
                  >
                    Miss
                  </Button>
                </div>
              </div>

              {/* Chip Shots */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Chip Shots</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((chips) => (
                    <Button
                      key={chips}
                      variant={golfScore.chipShots === chips ? "default" : "outline"}
                      className={`h-12 rounded-2xl ${
                        golfScore.chipShots === chips
                          ? "bg-teal-600 hover:bg-teal-700 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
                      }`}
                      onClick={() => setGolfScore((prev) => ({ ...prev, chipShots: chips }))}
                    >
                      {chips}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Greenside Sand Shots */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Greenside Sand Shots</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((sand) => (
                    <Button
                      key={sand}
                      variant={golfScore.greensideSandShots === sand ? "default" : "outline"}
                      className={`h-12 rounded-2xl ${
                        golfScore.greensideSandShots === sand
                          ? "bg-teal-600 hover:bg-teal-700 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
                      }`}
                      onClick={() => setGolfScore((prev) => ({ ...prev, greensideSandShots: sand }))}
                    >
                      {sand}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Hole Navigation */}
              <div className="flex items-center justify-center gap-4 py-4">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="font-semibold text-lg">Hole {match.currentHole}</span>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Submit Score Button */}
              <Button
                onClick={handleSubmitScore}
                disabled={isSubmitting || golfScore.strokes === 0}
                className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-lg font-semibold"
              >
                Submit Score
              </Button>

              {/* Progress Indicator */}
              <div className="text-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{match.currentHole} of 18 holes completed</p>
              </div>
            </>
          )}

          {/* Waiting for other players */}
          {playerScore && !allScoresSubmitted && (
            <Card className="bg-white border-0 rounded-2xl shadow-sm">
              <CardContent className="p-6 text-center">
                <p className="text-gray-600 mb-2">Your score: {playerScore.strokes} strokes</p>
                <p className="text-gray-500">Waiting for other players to submit their scores...</p>
              </CardContent>
            </Card>
          )}

          {/* Confirm scores */}
          {allScoresSubmitted && !allScoresConfirmed && (
            <Button
              onClick={handleConfirmScores}
              className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-lg font-semibold"
            >
              Confirm All Scores
            </Button>
          )}

          {/* Hole complete */}
          {allScoresConfirmed && (
            <Card className="bg-green-50 border-green-200 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="text-green-600 font-semibold text-lg">✓ Hole Complete - Moving to next hole...</div>
              </CardContent>
            </Card>
          )}
        </div>

        <BottomNav />
      </div>
    )
  }
}
