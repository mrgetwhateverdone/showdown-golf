"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users } from "lucide-react"

interface Player {
  id: string
  username: string
}

interface TeamSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  players: Player[]
  format: "2v1" | "2v2"
  onTeamsConfirmed: (teamBlue: Player[], teamRed: Player[]) => void
}

export function TeamSelectionModal({ isOpen, onClose, players, format, onTeamsConfirmed }: TeamSelectionModalProps) {
  const [teamBlue, setTeamBlue] = useState<Player[]>([])
  const [teamRed, setTeamRed] = useState<Player[]>([])
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({})

  const teamBlueSize = format === "2v1" ? 2 : 2 // 2v1: 2 players, 2v2: 2 players
  const teamRedSize = format === "2v1" ? 1 : 2 // 2v1: 1 player, 2v2: 2 players
  const isValidTeamSetup = teamBlue.length === teamBlueSize && teamRed.length === teamRedSize

  const moveToTeam = (player: Player, team: "blue" | "red") => {
    // Remove player from both teams first
    setTeamBlue((prev) => prev.filter((p) => p.id !== player.id))
    setTeamRed((prev) => prev.filter((p) => p.id !== player.id))

    // Add to selected team if there's space
    if (team === "blue" && teamBlue.length < teamBlueSize) {
      setTeamBlue((prev) => [...prev, player])
    } else if (team === "red" && teamRed.length < teamRedSize) {
      setTeamRed((prev) => [...prev, player])
    }

    // Reset confirmations when teams change
    setConfirmations({})
  }

  const toggleConfirmation = (playerId: string) => {
    setConfirmations((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }))
  }

  const allPlayersConfirmed = players.every((player) => confirmations[player.id])

  const handleConfirmTeams = () => {
    if (isValidTeamSetup && allPlayersConfirmed) {
      onTeamsConfirmed(teamBlue, teamRed)
      onClose()
    }
  }

  const unassignedPlayers = players.filter(
    (player) => !teamBlue.some((p) => p.id === player.id) && !teamRed.some((p) => p.id === player.id),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Choose Teams</DialogTitle>
          <p className="text-center text-gray-600 text-sm">
            Pick teams for your {format} match. All players must confirm before starting.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Team Blue */}
          <Card className="p-4 border-2 border-blue-500 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <h3 className="font-semibold text-blue-700">
                Team Blue ({teamBlueSize} player{teamBlueSize !== 1 ? "s" : ""})
              </h3>
            </div>
            <div className="space-y-2">
              {teamBlue.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <span className="font-medium">{player.username}</span>
                  <Button
                    size="sm"
                    variant={confirmations[player.id] ? "default" : "outline"}
                    onClick={() => toggleConfirmation(player.id)}
                    className={confirmations[player.id] ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {confirmations[player.id] ? "✓ Confirmed" : "Confirm"}
                  </Button>
                </div>
              ))}
              {teamBlue.length < teamBlueSize && (
                <div className="text-sm text-gray-500 text-center py-2">
                  {teamBlueSize - teamBlue.length} more player{teamBlueSize - teamBlue.length !== 1 ? "s" : ""} needed
                </div>
              )}
            </div>
          </Card>

          {/* Team Red */}
          <Card className="p-4 border-2 border-red-500 bg-red-50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <h3 className="font-semibold text-red-700">
                Team Red ({teamRedSize} player{teamRedSize !== 1 ? "s" : ""})
              </h3>
            </div>
            <div className="space-y-2">
              {teamRed.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <span className="font-medium">{player.username}</span>
                  <Button
                    size="sm"
                    variant={confirmations[player.id] ? "default" : "outline"}
                    onClick={() => toggleConfirmation(player.id)}
                    className={confirmations[player.id] ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {confirmations[player.id] ? "✓ Confirmed" : "Confirm"}
                  </Button>
                </div>
              ))}
              {teamRed.length < teamRedSize && (
                <div className="text-sm text-gray-500 text-center py-2">
                  {teamRedSize - teamRed.length} more player{teamRedSize - teamRed.length !== 1 ? "s" : ""} needed
                </div>
              )}
            </div>
          </Card>

          {/* Unassigned Players */}
          {unassignedPlayers.length > 0 && (
            <Card className="p-4 border-2 border-gray-300">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" />
                <h3 className="font-semibold">Choose Your Team</h3>
              </div>
              <div className="space-y-2">
                {unassignedPlayers.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">{player.username}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveToTeam(player, "blue")}
                        disabled={teamBlue.length >= teamBlueSize}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        Join Blue
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveToTeam(player, "red")}
                        disabled={teamRed.length >= teamRedSize}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Join Red
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Confirm Button */}
          <Button
            onClick={handleConfirmTeams}
            disabled={!isValidTeamSetup || !allPlayersConfirmed}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl"
          >
            {!isValidTeamSetup
              ? "Assign All Players to Teams"
              : !allPlayersConfirmed
                ? "All Players Must Confirm"
                : "Start Match"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
