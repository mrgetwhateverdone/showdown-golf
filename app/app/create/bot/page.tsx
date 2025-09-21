"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { useMatch, SAMPLE_COURSES, type GameType } from "@/lib/match"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { ArrowLeft, Settings, DollarSign, Flag } from "lucide-react"

export default function CreateBotMatch() {
  const { user } = useAuth()
  const { createBotMatch } = useMatch()
  const router = useRouter()
  const { toast } = useToast()

  const [gameType, setGameType] = useState<GameType>("stroke-play")
  const [courseId, setCourseId] = useState(SAMPLE_COURSES[0].id)
  const [wager, setWager] = useState(0)
  const [holeCount, setHoleCount] = useState<9 | 18>(18)
  const [isCreating, setIsCreating] = useState(false)

  if (!user) {
    router.push("/")
    return null
  }

  const handleCreate = async () => {
    if (wager > user.balance) {
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
      const matchId = await createBotMatch({
        creatorId: user.id,
        gameType,
        format: "1v1",
        course: { ...course, holes: holeCount },
        wager,
        players: [{ id: user.id, username: user.username, ready: false }],
        isPublic: false,
      })

      toast({
        title: "Bot Match Created!",
        description: "Your practice match against the bot is ready",
      })

      router.push(`/app/match/${matchId}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bot match",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
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
            <h1 className="text-2xl font-bold">Play vs. Bot</h1>
            <p className="text-gray-500">Practice match against AI</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Holes Section */}
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
                    holeCount === 9 ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="font-semibold">9 Holes</div>
                  <div className="text-sm text-gray-600">Quick round</div>
                </button>

                <button
                  onClick={() => setHoleCount(18)}
                  className={`p-4 rounded-2xl border-2 text-center transition-colors ${
                    holeCount === 18 ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
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
                    ? "border-blue-500 bg-blue-50"
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
                  gameType === "skins" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Skins</div>
                <div className="text-sm text-gray-600">Win individual holes</div>
              </button>

              {/* Match Play */}
              <button
                onClick={() => setGameType("match-play")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                  gameType === "match-play" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
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
              <h2 className="text-lg font-bold">Practice Wager</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-600">Amount ($) - Optional</Label>
              <Input
                type="number"
                min="0"
                max={user.balance}
                value={wager}
                onChange={(e) => setWager(Number(e.target.value))}
                className="h-12 rounded-2xl text-lg"
                placeholder="0"
              />
              <p className="text-sm text-gray-500">Your balance: ${user.balance} • Bot matches are for practice only</p>
            </div>
          </Card>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-3xl"
          >
            {isCreating ? "Creating Bot Match..." : "Start Practice Match"}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
