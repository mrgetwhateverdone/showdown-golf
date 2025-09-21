"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { useMatch, SAMPLE_COURSES, type GameType, type MatchFormat } from "@/lib/match"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { ArrowLeft, Users, Settings, MapPin, Calendar, DollarSign, Target, Flag } from "lucide-react"
import { CourseSelectionModal } from "@/components/course-selection-modal"
import { TeamSelectionModal } from "@/components/team-selection-modal"

export default function CreatePublicMatch() {
  const { user } = useAuth()
  const { createMatch } = useMatch()
  const router = useRouter()
  const { toast } = useToast()
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showTeamSelection, setShowTeamSelection] = useState(false)

  const [gameType, setGameType] = useState<GameType>("stroke-play")
  const [format, setFormat] = useState<MatchFormat>("1v1")
  const [courseId, setCourseId] = useState(SAMPLE_COURSES[0].id)
  const [courseType, setCourseType] = useState<"open" | "specific">("open")
  const [handicapType, setHandicapType] = useState<"handicapped" | "scratch" | "custom">("handicapped")
  const [wagerType, setWagerType] = useState<"total" | "fun" | "per-hole">("total")
  const [wager, setWager] = useState(5)
  const [holeCount, setHoleCount] = useState<9 | 18>(18)
  const [isCreating, setIsCreating] = useState(false)

  if (!user) {
    router.push("/")
    return null
  }

  const isPerHoleDisabled = gameType !== "skins"

  const handleCreate = async () => {
    if (format === "2v1" || format === "2v2") {
      setShowTeamSelection(true)
      return
    }

    if (wagerType === "total" && wager > user.balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough money for this wager",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const course = SAMPLE_COURSES.find((c) => c.id === courseId)!
      const matchId = await createMatch({
        creatorId: user.id,
        gameType,
        format,
        course: { ...course, holes: holeCount },
        wager: wagerType === "fun" ? 0 : wager,
        players: [{ id: user.id, username: user.username, ready: false }],
        isPublic: true,
      })

      toast({
        title: "Challenge Posted!",
        description: "Your open challenge is now available for others to join",
      })

      router.push(`/app/match/${matchId}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleTeamsConfirmed = (teamBlue: any[], teamRed: any[]) => {
    setShowTeamSelection(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader />

      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Create Challenge</h1>
            <p className="text-gray-500">Format: {format === "1v1" ? "1v1" : format === "2v1" ? "2v1" : "2v2"}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Players Section */}
          <Card className="p-6 bg-white rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5" />
              <h2 className="text-lg font-bold">Players</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-600">Maximum Players</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as MatchFormat)}>
                <SelectTrigger className="h-14 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1v1">1v1</SelectItem>
                  <SelectItem value="2v1">2v1</SelectItem>
                  <SelectItem value="2v2">2v2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Hole Count Section */}
          <Card className="p-6 bg-white rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Flag className="w-5 h-5" />
              <h2 className="text-lg font-bold">Holes</h2>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setHoleCount(9)}
                  className={`p-4 rounded-2xl border-2 text-center transition-colors ${
                    holeCount === 9 ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="font-semibold">9 Holes</div>
                  <div className="text-sm text-gray-600">Quick round</div>
                </button>

                <button
                  onClick={() => setHoleCount(18)}
                  className={`p-4 rounded-2xl border-2 text-center transition-colors ${
                    holeCount === 18 ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="font-semibold">18 Holes</div>
                  <div className="text-sm text-gray-600">Full round</div>
                </button>
              </div>
            </div>
          </Card>

          {/* Game Type Section */}
          <Card className="p-6 bg-white rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5" />
              <h2 className="text-lg font-bold">Game Type</h2>
            </div>

            <div className="space-y-3">
              {/* Stroke Play */}
              <button
                onClick={() => setGameType("stroke-play")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  gameType === "stroke-play"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Stroke Play</div>
                <div className="text-sm text-gray-600">Lowest total score wins</div>
              </button>

              {/* Skins */}
              <button
                onClick={() => setGameType("skins")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  gameType === "skins" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Skins</div>
                <div className="text-sm text-gray-600">Win individual holes</div>
              </button>

              {/* Match Play */}
              <button
                onClick={() => setGameType("match-play")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  gameType === "match-play"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Match Play</div>
                <div className="text-sm text-gray-600">Head-to-head hole by hole</div>
              </button>
            </div>
          </Card>

          {/* Wager Section */}
          <Card className="p-6 bg-white rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-5 h-5" />
              <h2 className="text-lg font-bold">Wager</h2>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => wagerType !== "per-hole" && gameType === "skins" && setWagerType("per-hole")}
                disabled={isPerHoleDisabled}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  wagerType === "per-hole" && !isPerHoleDisabled
                    ? "border-green-500 bg-green-50"
                    : isPerHoleDisabled
                      ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className={`font-semibold ${isPerHoleDisabled ? "text-gray-400" : ""}`}>Per Hole</div>
                <div className={`text-sm ${isPerHoleDisabled ? "text-gray-400" : "text-gray-600"}`}>
                  Amount per hole won
                </div>
                {isPerHoleDisabled && (
                  <div className="text-xs text-gray-400 mt-1">Only available for Skins game type</div>
                )}
              </button>

              {/* Total Match */}
              <button
                onClick={() => setWagerType("total")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  wagerType === "total" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Total Match</div>
                <div className="text-sm text-gray-600">Winner takes all</div>
              </button>

              {/* Just for Fun */}
              <button
                onClick={() => setWagerType("fun")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  wagerType === "fun" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Just for Fun</div>
                <div className="text-sm text-gray-600">No money involved</div>
              </button>

              {(wagerType === "total" || wagerType === "per-hole") && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-600">
                    Amount ($) {wagerType === "per-hole" ? "per hole" : "total"}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max={user.balance}
                    value={wager}
                    onChange={(e) => setWager(Number(e.target.value))}
                    className="mt-2 h-12 rounded-2xl text-lg"
                    placeholder="5"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Handicap Section */}
          <Card className="p-6 bg-white rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5" />
              <h2 className="text-lg font-bold">Handicap</h2>
            </div>

            <div className="space-y-3">
              {/* Handicapped */}
              <button
                onClick={() => setHandicapType("handicapped")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  handicapType === "handicapped"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Handicapped</div>
                <div className="text-sm text-gray-600">Use official handicaps</div>
              </button>

              {/* Scratch */}
              <button
                onClick={() => setHandicapType("scratch")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  handicapType === "scratch"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Scratch</div>
                <div className="text-sm text-gray-600">No handicap adjustments</div>
              </button>

              {/* Custom */}
              <button
                onClick={() => setHandicapType("custom")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  handicapType === "custom"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Custom</div>
                <div className="text-sm text-gray-600">Set custom handicaps</div>
              </button>
            </div>
          </Card>

          {/* Course Section */}
          <Card className="p-6 bg-white rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5" />
              <h2 className="text-lg font-bold">Course</h2>
            </div>

            <div className="space-y-3">
              {/* Open */}
              <button
                onClick={() => setCourseType("open")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  courseType === "open" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Open</div>
                <div className="text-sm text-gray-600">Any course</div>
              </button>

              {/* Specific */}
              <button
                onClick={() => setCourseType("specific")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  courseType === "specific"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Specific</div>
                <div className="text-sm text-gray-600">Choose course</div>
              </button>

              {courseType === "specific" && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCourseModal(true)}
                    className="w-full h-12 rounded-2xl justify-between"
                  >
                    <div className="text-left">
                      {courseId ? (
                        <div>
                          <div className="font-medium">{SAMPLE_COURSES.find((c) => c.id === courseId)?.name}</div>
                          <div className="text-sm text-gray-500">
                            {SAMPLE_COURSES.find((c) => c.id === courseId)?.location}
                          </div>
                        </div>
                      ) : (
                        "Select a course"
                      )}
                    </div>
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Schedule Section */}
          <Card className="p-6 bg-white rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5" />
              <h2 className="text-lg font-bold">Schedule</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Date</Label>
                <Input type="date" className="mt-2 h-12 rounded-2xl" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Time</Label>
                <Input type="time" className="mt-2 h-12 rounded-2xl" placeholder="--:-- --" />
              </div>
            </div>
          </Card>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-3xl"
          >
            {isCreating ? "Posting Challenge..." : "Post Challenge"}
          </Button>
        </div>
      </div>

      <BottomNav />

      <CourseSelectionModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onSelectCourse={setCourseId}
        selectedCourseId={courseId}
      />

      <TeamSelectionModal
        isOpen={showTeamSelection}
        onClose={() => setShowTeamSelection(false)}
        format={format as "2v1" | "2v2"}
        players={
          format === "2v1"
            ? [
                { id: "player1", username: "Player 1" },
                { id: "player2", username: "Player 2" },
                { id: "player3", username: "Player 3" },
              ]
            : [
                { id: "player1", username: "Player 1" },
                { id: "player2", username: "Player 2" },
                { id: "player3", username: "Player 3" },
                { id: "player4", username: "Player 4" },
              ]
        }
        onTeamsConfirmed={handleTeamsConfirmed}
      />
    </div>
  )
}
