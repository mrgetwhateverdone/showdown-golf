"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type GameType = "stroke-play" | "match-play" | "skins"
export type MatchFormat = "1v1" | "2v1" | "2v2"
export type MatchStatus = "waiting" | "ready" | "in-progress" | "completed"

export interface Course {
  id: string
  name: string
  location: string
  holes: number
  par: number[]
}

export interface Player {
  id: string
  username: string
  ready: boolean
}

export interface HoleScore {
  playerId: string
  strokes: number
  confirmed: boolean
}

export interface Hole {
  number: number
  par: number
  scores: HoleScore[]
  completed: boolean
}

export interface Team {
  id: string
  name: string
  color: string
  playerIds: string[]
}

export interface Match {
  id: string
  creatorId: string
  gameType: GameType
  format: MatchFormat
  course: Course
  players: Player[]
  maxPlayers: number
  wager: number
  status: MatchStatus
  currentHole: number
  holes: Hole[]
  winner?: string
  prizeDistributed?: boolean
  createdAt: string
  expiresAt: string
  teams?: Team[] // For 2v1 and 2v2 matches
}

interface MatchContextType {
  matches: Match[]
  currentMatch: Match | null
  createMatch: (matchData: Partial<Match>) => Promise<string>
  createBotMatch: (matchData: Partial<Match>) => Promise<string>
  joinMatch: (matchId: string, playerId: string) => Promise<boolean>
  startMatch: (matchId: string, playerId: string) => Promise<boolean>
  submitScore: (matchId: string, playerId: string, hole: number, strokes: number) => Promise<boolean>
  confirmScore: (matchId: string, playerId: string, hole: number) => Promise<boolean>
  getMatch: (matchId: string) => Match | null
  refreshMatches: () => void
}

const MatchContext = createContext<MatchContextType | undefined>(undefined)

// Sample courses
const SAMPLE_COURSES: Course[] = [
  {
    id: "blue-hills-cc",
    name: "Blue Hills Country Club",
    location: "Kansas City, Missouri",
    holes: 18,
    par: [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4],
  },
  {
    id: "country-club-kc",
    name: "The Country Club of Kansas City",
    location: "Mission Hills, Kansas",
    holes: 18,
    par: [4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 4, 4],
  },
  {
    id: "the-national",
    name: "The National",
    location: "Parkville, Missouri",
    holes: 18,
    par: [4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 3, 4, 5, 4, 3, 4, 4],
  },
  {
    id: "overland-park-gc",
    name: "Overland Park Golf Course",
    location: "Overland Park, Kansas",
    holes: 18,
    par: [4, 3, 4, 5, 4, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4],
  },
  {
    id: "painted-hills-gc",
    name: "Painted Hills Golf Club",
    location: "Kansas City, Kansas",
    holes: 18,
    par: [4, 4, 3, 4, 5, 4, 4, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4],
  },
  {
    id: "prairie-highlands-gc",
    name: "Prairie Highlands Golf Course",
    location: "Olathe, Kansas",
    holes: 18,
    par: [4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 4, 3, 4, 5, 4, 3, 4, 4],
  },
  {
    id: "shiloh-springs",
    name: "Shiloh Springs",
    location: "Platte City, Missouri",
    holes: 18,
    par: [4, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 4, 4, 5, 3, 4],
  },
  {
    id: "shoal-creek-gc",
    name: "Shoal Creek Golf Club",
    location: "Liberty, Missouri",
    holes: 18,
    par: [4, 3, 5, 4, 4, 3, 4, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4],
  },
  {
    id: "tiffany-greens-gc",
    name: "Tiffany Greens Golf Club",
    location: "Kansas City, Missouri",
    holes: 18,
    par: [4, 4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4],
  },
]

export function MatchProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)

  useEffect(() => {
    refreshMatches()
  }, [])

  const refreshMatches = () => {
    const savedMatches = JSON.parse(localStorage.getItem("golf-matches") || "[]")
    // Filter out expired matches
    const activeMatches = savedMatches.filter(
      (match: Match) => new Date(match.expiresAt) > new Date() || match.status !== "waiting",
    )
    setMatches(activeMatches)
    localStorage.setItem("golf-matches", JSON.stringify(activeMatches))
  }

  const createMatch = async (matchData: Partial<Match>): Promise<string> => {
    const course = SAMPLE_COURSES.find((c) => c.id === matchData.course?.id) || SAMPLE_COURSES[0]

    const holeCount = matchData.course?.holes || 18

    // Initialize holes with proper structure based on hole count
    const holes: Hole[] = Array.from({ length: holeCount }, (_, i) => ({
      number: i + 1,
      par: course.par[i] || 4, // Default to par 4 if par array is shorter
      scores: [],
      completed: false,
    }))

    const maxPlayers = matchData.format === "1v1" ? 2 : matchData.format === "2v1" ? 3 : 4

    const newMatch: Match = {
      id: Date.now().toString(),
      creatorId: matchData.creatorId!,
      gameType: matchData.gameType || "stroke-play",
      format: matchData.format || "1v1",
      course: { ...course, holes: holeCount },
      players: [
        {
          id: matchData.creatorId!,
          username: matchData.players?.[0]?.username || "Player 1",
          ready: false,
        },
      ],
      maxPlayers,
      wager: matchData.wager || 0,
      status: "waiting",
      currentHole: 1,
      holes,
      prizeDistributed: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }

    // Deduct wager from creator's balance
    if (newMatch.wager > 0) {
      const success = deductWager(newMatch.creatorId, newMatch.wager)
      if (!success) {
        throw new Error("Insufficient balance for wager")
      }
    }

    const updatedMatches = [...matches, newMatch]
    setMatches(updatedMatches)
    localStorage.setItem("golf-matches", JSON.stringify(updatedMatches))

    return newMatch.id
  }

  const createBotMatch = async (matchData: Partial<Match>): Promise<string> => {
    const course = SAMPLE_COURSES.find((c) => c.id === matchData.course?.id) || SAMPLE_COURSES[0]

    const holeCount = matchData.course?.holes || 18

    // Initialize holes with proper structure based on hole count
    const holes: Hole[] = Array.from({ length: holeCount }, (_, i) => ({
      number: i + 1,
      par: course.par[i] || 4, // Default to par 4 if par array is shorter
      scores: [],
      completed: false,
    }))

    const newMatch: Match = {
      id: Date.now().toString(),
      creatorId: matchData.creatorId!,
      gameType: matchData.gameType || "stroke-play",
      format: "1v1",
      course: { ...course, holes: holeCount },
      players: [
        {
          id: matchData.creatorId!,
          username: matchData.players?.[0]?.username || "Player 1",
          ready: false,
        },
        {
          id: "bot-player",
          username: "Golf Bot",
          ready: true,
        },
      ],
      maxPlayers: 2,
      wager: matchData.wager || 0,
      status: "waiting",
      currentHole: 1,
      holes,
      prizeDistributed: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }

    // Deduct wager from creator's balance (bot matches still use wager for practice)
    if (newMatch.wager > 0) {
      const success = deductWager(newMatch.creatorId, newMatch.wager)
      if (!success) {
        throw new Error("Insufficient balance for wager")
      }
    }

    const updatedMatches = [...matches, newMatch]
    setMatches(updatedMatches)
    localStorage.setItem("golf-matches", JSON.stringify(updatedMatches))

    return newMatch.id
  }

  const joinMatch = async (matchId: string, playerId: string): Promise<boolean> => {
    const match = matches.find((m) => m.id === matchId)
    if (!match || match.players.length >= match.maxPlayers || match.status !== "waiting") {
      return false
    }

    // Get user info
    const users = JSON.parse(localStorage.getItem("golf-users") || "[]")
    const user = users.find((u: any) => u.id === playerId)
    if (!user) return false

    // Check if user has enough balance for wager
    if (match.wager > 0 && user.balance < match.wager) {
      return false
    }

    // Deduct wager from joining player's balance
    if (match.wager > 0) {
      const success = deductWager(playerId, match.wager)
      if (!success) return false
    }

    const updatedMatch = {
      ...match,
      players: [
        ...match.players,
        {
          id: playerId,
          username: user.username,
          ready: false,
        },
      ],
    }

    const updatedMatches = matches.map((m) => (m.id === matchId ? updatedMatch : m))
    setMatches(updatedMatches)
    localStorage.setItem("golf-matches", JSON.stringify(updatedMatches))

    return true
  }

  const startMatch = async (matchId: string, playerId: string): Promise<boolean> => {
    const match = matches.find((m) => m.id === matchId)
    if (!match) return false

    // Mark player as ready
    const updatedPlayers = match.players.map((p) => (p.id === playerId ? { ...p, ready: true } : p))

    // Check if all players are ready
    const allReady = updatedPlayers.every((p) => p.ready) && updatedPlayers.length === match.maxPlayers

    const updatedMatch = {
      ...match,
      players: updatedPlayers,
      status: allReady ? ("in-progress" as MatchStatus) : match.status,
    }

    const updatedMatches = matches.map((m) => (m.id === matchId ? updatedMatch : m))
    setMatches(updatedMatches)
    localStorage.setItem("golf-matches", JSON.stringify(updatedMatches))

    if (allReady) {
      setCurrentMatch(updatedMatch)
    }

    return true
  }

  const submitScore = async (matchId: string, playerId: string, hole: number, strokes: number): Promise<boolean> => {
    const match = matches.find((m) => m.id === matchId)
    if (!match || match.status !== "in-progress") return false

    const holeIndex = hole - 1
    const currentHole = match.holes[holeIndex]

    // Update or add score for this player
    const existingScoreIndex = currentHole.scores.findIndex((s) => s.playerId === playerId)
    const updatedScores = [...currentHole.scores]

    if (existingScoreIndex >= 0) {
      updatedScores[existingScoreIndex] = { playerId, strokes, confirmed: false }
    } else {
      updatedScores.push({ playerId, strokes, confirmed: false })
    }

    // If this is a bot match and the human player just submitted, generate bot score
    const isBot = match.players.some((p) => p.id === "bot-player")
    if (isBot && playerId !== "bot-player") {
      const botScore = generateBotScore(currentHole.par, match.gameType)
      const botScoreIndex = updatedScores.findIndex((s) => s.playerId === "bot-player")

      if (botScoreIndex >= 0) {
        updatedScores[botScoreIndex] = { playerId: "bot-player", strokes: botScore, confirmed: true }
      } else {
        updatedScores.push({ playerId: "bot-player", strokes: botScore, confirmed: true })
      }
    }

    const updatedHoles = [...match.holes]
    updatedHoles[holeIndex] = { ...currentHole, scores: updatedScores }

    const updatedMatch = { ...match, holes: updatedHoles }
    const updatedMatches = matches.map((m) => (m.id === matchId ? updatedMatch : m))

    setMatches(updatedMatches)
    localStorage.setItem("golf-matches", JSON.stringify(updatedMatches))
    setCurrentMatch(updatedMatch)

    return true
  }

  const confirmScore = async (matchId: string, playerId: string, hole: number): Promise<boolean> => {
    const match = matches.find((m) => m.id === matchId)
    if (!match || match.status !== "in-progress") return false

    const holeIndex = hole - 1
    const currentHole = match.holes[holeIndex]

    // For stroke play, don't allow per-hole confirmation - scores are confirmed at the end
    if (match.gameType === "stroke-play") {
      // Mark player's score as confirmed but don't move to next hole until all 18 are played
      const updatedScores = currentHole.scores.map((s) => (s.playerId === playerId ? { ...s, confirmed: true } : s))

      // Check if all players have confirmed this hole
      const allConfirmed = updatedScores.length === match.players.length && updatedScores.every((s) => s.confirmed)

      const updatedHoles = [...match.holes]
      updatedHoles[holeIndex] = {
        ...currentHole,
        scores: updatedScores,
        completed: allConfirmed,
      }

      // Move to next hole if current hole is complete
      let nextHole = match.currentHole
      if (allConfirmed && match.currentHole < match.course.holes) {
        nextHole = match.currentHole + 1
      }

      // Check if match is complete (all holes played)
      const allHolesComplete =
        nextHole > match.course.holes || updatedHoles.slice(0, match.course.holes).every((h) => h.completed)
      let winner: string | undefined

      if (allHolesComplete) {
        winner = calculateWinner(match.gameType, updatedHoles, match.players)

        // Distribute prize money
        if (match.wager > 0 && !match.prizeDistributed) {
          distributePrize(match, winner)
        }
      }

      const updatedMatch = {
        ...match,
        holes: updatedHoles,
        currentHole: nextHole,
        status: allHolesComplete ? ("completed" as MatchStatus) : match.status,
        winner,
        prizeDistributed: allHolesComplete && match.wager > 0,
      }

      const updatedMatches = matches.map((m) => (m.id === matchId ? updatedMatch : m))

      setMatches(updatedMatches)
      localStorage.setItem("golf-matches", JSON.stringify(updatedMatches))
      setCurrentMatch(updatedMatch)

      return true
    }

    // For match play and skins, confirm scores hole by hole
    const updatedScores = currentHole.scores.map((s) => ({ ...s, confirmed: true }))

    // Check if hole is complete (all players have confirmed scores)
    const allConfirmed = updatedScores.length === match.players.length && updatedScores.every((s) => s.confirmed)

    const updatedHoles = [...match.holes]
    updatedHoles[holeIndex] = {
      ...currentHole,
      scores: updatedScores,
      completed: allConfirmed,
    }

    // Move to next hole if current hole is complete
    let nextHole = match.currentHole
    if (allConfirmed && match.currentHole < match.course.holes) {
      nextHole = match.currentHole + 1
    }

    // Check if match is complete
    const allHolesComplete = updatedHoles.slice(0, match.course.holes).every((h) => h.completed)
    let winner: string | undefined

    if (allHolesComplete) {
      winner = calculateWinner(match.gameType, updatedHoles, match.players)

      // Distribute prize money
      if (match.wager > 0 && !match.prizeDistributed) {
        distributePrize(match, winner)
      }
    }

    const updatedMatch = {
      ...match,
      holes: updatedHoles,
      currentHole: nextHole,
      status: allHolesComplete ? ("completed" as MatchStatus) : match.status,
      winner,
      prizeDistributed: allHolesComplete && match.wager > 0,
    }

    const updatedMatches = matches.map((m) => (m.id === matchId ? updatedMatch : m))

    setMatches(updatedMatches)
    localStorage.setItem("golf-matches", JSON.stringify(updatedMatches))
    setCurrentMatch(updatedMatch)

    return true
  }

  const getMatch = (matchId: string): Match | null => {
    return matches.find((m) => m.id === matchId) || null
  }

  return (
    <MatchContext.Provider
      value={{
        matches,
        currentMatch,
        createMatch,
        createBotMatch,
        joinMatch,
        startMatch,
        submitScore,
        confirmScore,
        getMatch,
        refreshMatches,
      }}
    >
      {children}
    </MatchContext.Provider>
  )
}

// Helper function to deduct wager from player's balance
function deductWager(playerId: string, amount: number): boolean {
  const users = JSON.parse(localStorage.getItem("golf-users") || "[]")
  const userIndex = users.findIndex((u: any) => u.id === playerId)

  if (userIndex === -1 || users[userIndex].balance < amount) {
    return false
  }

  users[userIndex].balance -= amount
  localStorage.setItem("golf-users", JSON.stringify(users))

  // Update current user if it's them
  const currentUser = JSON.parse(localStorage.getItem("golf-user") || "null")
  if (currentUser && currentUser.id === playerId) {
    currentUser.balance -= amount
    localStorage.setItem("golf-user", JSON.stringify(currentUser))
  }

  return true
}

// Helper function to distribute prize money
function distributePrize(match: Match, winnerId: string) {
  const totalPrize = match.wager * match.players.length

  if (match.gameType === "skins") {
    // For skins, distribute money per skin won with carryover logic
    let carryoverValue = 0
    const baseValue = totalPrize / match.course.holes // Base value per hole

    match.holes.forEach((hole) => {
      const allScores = hole.scores.map((s) => s.strokes)
      const minScore = Math.min(...allScores)
      const winners = hole.scores.filter((s) => s.strokes === minScore)

      const holeValue = baseValue + carryoverValue

      if (winners.length === 1) {
        // Single winner gets the hole value plus any carryover
        addToBalance(winners[0].playerId, holeValue)
        carryoverValue = 0
      } else {
        // Tie - value carries over to next hole
        carryoverValue += baseValue
      }
    })

    // If there's remaining carryover, distribute equally among all players
    if (carryoverValue > 0) {
      const perPlayer = carryoverValue / match.players.length
      match.players.forEach((player) => {
        addToBalance(player.id, perPlayer)
      })
    }
  } else {
    // For stroke play and match play, winner takes all
    addToBalance(winnerId, totalPrize)
  }
}

// Helper function to add money to player's balance
function addToBalance(playerId: string, amount: number) {
  const users = JSON.parse(localStorage.getItem("golf-users") || "[]")
  const userIndex = users.findIndex((u: any) => u.id === playerId)

  if (userIndex !== -1) {
    users[userIndex].balance += amount
    localStorage.setItem("golf-users", JSON.stringify(users))

    // Update current user if it's them
    const currentUser = JSON.parse(localStorage.getItem("golf-user") || "null")
    if (currentUser && currentUser.id === playerId) {
      currentUser.balance += amount
      localStorage.setItem("golf-user", JSON.stringify(currentUser))
    }
  }
}

// Calculate winner based on game type
function calculateWinner(gameType: GameType, holes: Hole[], players: Player[]): string {
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

// Bot score generation function
function generateBotScore(par: number, gameType: GameType): number {
  // Generate realistic bot scores based on par and game type
  const skillLevel = 0.7 // Bot plays at about 70% skill level

  // Base score around par with some variation
  let baseScore = par

  // Add randomness based on hole difficulty
  const variation = Math.random()

  if (variation < 0.1) {
    // 10% chance of birdie or better
    baseScore = Math.max(1, par - 1 - Math.floor(Math.random() * 2))
  } else if (variation < 0.4) {
    // 30% chance of par
    baseScore = par
  } else if (variation < 0.8) {
    // 40% chance of bogey
    baseScore = par + 1
  } else {
    // 20% chance of double bogey or worse
    baseScore = par + 2 + Math.floor(Math.random() * 2)
  }

  // Ensure score is reasonable (1-10 strokes)
  return Math.max(1, Math.min(10, baseScore))
}

export function useMatch() {
  const context = useContext(MatchContext)
  if (context === undefined) {
    throw new Error("useMatch must be used within a MatchProvider")
  }
  return context
}

export { SAMPLE_COURSES }
