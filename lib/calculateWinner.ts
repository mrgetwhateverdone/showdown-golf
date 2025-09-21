import type { GameType, Player, Hole } from "@/lib/match"

export function calculateWinner(gameType: GameType, holes: Hole[], players: Player[]): string {
  if (gameType === "stroke-play") {
    // Lowest total strokes wins
    const totals = players.map((player) => ({
      playerId: player.id,
      total: holes.reduce((sum, hole) => {
        const score = hole.scores.find((s) => s.playerId === player.id)
        return sum + (score?.strokes || 0)
      }, 0),
    }))

    return totals.reduce((winner, current) => (current.total < winner.total ? current : winner)).playerId
  }

  if (gameType === "match-play") {
    // Most holes won
    const holesWon = players.map((player) => ({
      playerId: player.id,
      holesWon: holes.filter((hole) => {
        const playerScore = hole.scores.find((s) => s.playerId === player.id)?.strokes || 999
        const opponentScores = hole.scores.filter((s) => s.playerId !== player.id).map((s) => s.strokes)
        const bestOpponent = Math.min(...opponentScores, 999)
        return playerScore < bestOpponent
      }).length,
    }))

    return holesWon.reduce((winner, current) => (current.holesWon > winner.holesWon ? current : winner)).playerId
  }

  if (gameType === "skins") {
    // Most skins won (holes where you had the lowest unique score)
    const skinsWon = players.map((player) => ({
      playerId: player.id,
      skins: holes.filter((hole) => {
        const playerScore = hole.scores.find((s) => s.playerId === player.id)?.strokes || 999
        const allScores = hole.scores.map((s) => s.strokes)
        const minScore = Math.min(...allScores)
        const minCount = allScores.filter((s) => s === minScore).length
        return playerScore === minScore && minCount === 1
      }).length,
    }))

    return skinsWon.reduce((winner, current) => (current.skins > winner.skins ? current : winner)).playerId
  }

  return players[0].id
}
