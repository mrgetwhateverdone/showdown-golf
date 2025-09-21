"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth"
import { calculateWinner } from "@/lib/calculateWinner" // Import calculateWinner

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
  matchType?: string
  handicapType?: string
  wagerType?: string
}

interface MatchContextType {
  matches: Match[]
  currentMatch: Match | null
  publicMatches: Match[]
  userMatches: Match[]
  isLoadingPublic: boolean
  refreshPublicMatches: () => Promise<void>
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
  const [publicMatches, setPublicMatches] = useState<Match[]>([])
  const [userMatches, setUserMatches] = useState<Match[]>([])
  const [isLoadingPublic, setIsLoadingPublic] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      refreshMatches()
      refreshPublicMatches()
    }
  }, [user])

  const refreshMatches = async () => {
    if (!user) return

    try {
      const { data: matchesData, error } = await supabase
        .from("matches")
        .select(`
          *,
          match_participants!inner(user_id),
          match_holes(
            id,
            hole_number,
            par,
            completed,
            match_scores(
              id,
              player_id,
              strokes,
              confirmed
            )
          )
        `)
        .or(`created_by.eq."${user.id}",match_participants.user_id.eq."${user.id}"`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching matches:", error)
        return
      }

      const transformedMatches: Match[] = await Promise.all(
        matchesData.map(async (match) => {
          // Get participants
          const { data: participants } = await supabase
            .from("match_participants")
            .select("user_id, profiles(display_name)")
            .eq("match_id", match.id)

          const players: Player[] =
            participants?.map((p) => ({
              id: p.user_id,
              username: (p.profiles as any)?.display_name || "Unknown",
              ready: match.status !== "waiting",
            })) || []

          // Get course info
          const course = SAMPLE_COURSES.find((c) => c.id === match.course_id) || SAMPLE_COURSES[0]

          // Transform holes
          const holes: Hole[] =
            match.match_holes?.map((hole: any) => ({
              number: hole.hole_number,
              par: hole.par,
              completed: hole.completed,
              scores:
                hole.match_scores?.map((score: any) => ({
                  playerId: score.player_id,
                  strokes: score.strokes,
                  confirmed: score.confirmed,
                })) || [],
            })) || []

          return {
            id: match.id,
            creatorId: match.created_by,
            gameType: match.game_type as GameType,
            format: match.format as MatchFormat,
            course,
            players,
            maxPlayers: match.max_players,
            wager: Number(match.wager_amount),
            status: match.status as MatchStatus,
            currentHole: match.current_hole,
            holes,
            winner: match.winner,
            prizeDistributed: match.status === "completed",
            createdAt: match.created_at,
            expiresAt: match.expires_at,
            matchType: match.match_type,
            handicapType: match.handicap_type,
            wagerType: match.wager_type,
          }
        }),
      )

      setUserMatches(transformedMatches)
      setMatches(transformedMatches)
    } catch (error) {
      console.error("[v0] Error in refreshMatches:", error)
    }
  }

  const refreshPublicMatches = async () => {
    if (!user) return

    setIsLoadingPublic(true)

    try {
      // Fetch ALL public matches that are available to join
      const { data: matchesData, error } = await supabase
        .from("matches")
        .select(`
          *,
          match_participants(
            user_id,
            profiles(display_name)
          ),
          match_holes(
            id,
            hole_number,
            par,
            completed,
            match_scores(
              id,
              player_id,
              strokes,
              confirmed
            )
          )
        `)
        .eq("status", "waiting") // Only fetch matches waiting for players
        .gt("expires_at", new Date().toISOString()) // Only non-expired matches
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching public matches:", error)
        return
      }

      // Transform the database results into Match objects
      const transformedMatches: Match[] = await Promise.all(
        matchesData.map(async (match) => {
          // Get participants with their profile info
          const participants = match.match_participants || []

          const players: Player[] = participants.map((p: any) => ({
            id: p.user_id,
            username: p.profiles?.display_name || "Unknown",
            ready: match.status !== "waiting",
          }))

          // Get course info
          const course = SAMPLE_COURSES.find((c) => c.id === match.course_id) || SAMPLE_COURSES[0]

          // Transform holes data
          const holes: Hole[] =
            match.match_holes?.map((hole: any) => ({
              number: hole.hole_number,
              par: hole.par,
              completed: hole.completed,
              scores:
                hole.match_scores?.map((score: any) => ({
                  playerId: score.player_id,
                  strokes: score.strokes,
                  confirmed: score.confirmed,
                })) || [],
            })) || []

          return {
            id: match.id,
            creatorId: match.created_by,
            gameType: match.game_type as GameType,
            format: match.format as MatchFormat,
            course,
            players,
            maxPlayers: match.max_players,
            wager: Number(match.wager_amount),
            status: match.status as MatchStatus,
            currentHole: match.current_hole,
            holes,
            winner: match.winner,
            prizeDistributed: match.status === "completed",
            createdAt: match.created_at,
            expiresAt: match.expires_at,
            matchType: match.match_type,
            handicapType: match.handicap_type,
            wagerType: match.wager_type,
          }
        }),
      )

      // Filter out matches where current user is already participating
      const availablePublicMatches = transformedMatches.filter(
        (match) => !match.players.some((player) => player.id === user.id),
      )

      setPublicMatches(availablePublicMatches)
    } catch (error) {
      console.error("[v0] Error in refreshPublicMatches:", error)
    } finally {
      setIsLoadingPublic(false)
    }
  }

  const createMatch = async (matchData: Partial<Match>): Promise<string> => {
    if (!user) throw new Error("User not authenticated")

    console.log("[v0] Starting match creation with data:", matchData)
    console.log("[v0] Current user:", { id: user.id, balance: user.balance })

    const course = SAMPLE_COURSES.find((c) => c.id === matchData.course?.id) || SAMPLE_COURSES[0]
    const holeCount = matchData.course?.holes || 18
    const maxPlayers = matchData.format === "1v1" ? 2 : matchData.format === "2v1" ? 3 : 4

    console.log("[v0] Course selected:", course)
    console.log("[v0] Hole count:", holeCount, "Max players:", maxPlayers)

    try {
      if (matchData.wager && matchData.wager > 0) {
        console.log("[v0] Processing wager:", matchData.wager)

        if (user.balance < matchData.wager) {
          console.log("[v0] Insufficient balance - user has:", user.balance, "needs:", matchData.wager)
          throw new Error("Insufficient balance for wager")
        }

        console.log("[v0] Deducting wager from balance...")
        const { error: balanceError } = await supabase
          .from("profiles")
          .update({ balance: user.balance - matchData.wager })
          .eq("id", user.id)

        if (balanceError) {
          console.log("[v0] Balance update error:", balanceError)
          throw balanceError
        }

        console.log("[v0] Recording transaction...")
        const { error: transactionError } = await supabase.from("transactions").insert({
          user_id: user.id,
          amount: -matchData.wager,
          transaction_type: "wager",
          description: "Match wager deducted",
        })

        if (transactionError) {
          console.log("[v0] Transaction error:", transactionError)
          throw transactionError
        }
      }

      console.log("[v0] Creating match record...")
      const { data: matchResult, error: matchError } = await supabase
        .from("matches")
        .insert({
          created_by: user.id,
          game_type: matchData.gameType || "stroke-play",
          format: matchData.format || "1v1",
          course_id: course.id,
          course_name: course.name,
          max_players: maxPlayers,
          wager_amount: matchData.wager || 0,
          status: "waiting",
          current_hole: 1,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          match_type: matchData.isPublic ? "public" : "private",
          handicap_type: "handicapped",
          wager_type: matchData.wager && matchData.wager > 0 ? "total" : "fun",
        })
        .select()
        .single()

      if (matchError) {
        console.log("[v0] Match creation error:", matchError)
        throw matchError
      }

      console.log("[v0] Match created successfully:", matchResult)
      const matchId = matchResult.id

      console.log("[v0] Adding participant...")
      const { error: participantError } = await supabase.from("match_participants").insert({
        match_id: matchId,
        user_id: user.id,
      })

      if (participantError) {
        console.log("[v0] Participant error:", participantError)
        throw participantError
      }

      console.log("[v0] Creating holes...")
      const holesData = Array.from({ length: holeCount }, (_, i) => ({
        match_id: matchId,
        hole_number: i + 1,
        par: course.par[i] || 4,
        completed: false,
      }))

      const { error: holesError } = await supabase.from("match_holes").insert(holesData)

      if (holesError) {
        console.log("[v0] Holes creation error:", holesError)
        throw holesError
      }

      console.log("[v0] Match creation completed successfully!")
      await refreshMatches()
      await refreshPublicMatches()
      return matchId
    } catch (error) {
      console.error("[v0] Error creating match:", error)
      throw error
    }
  }

  const createBotMatch = async (matchData: Partial<Match>): Promise<string> => {
    throw new Error("Bot matches not yet implemented with Supabase")
  }

  const joinMatch = async (matchId: string, playerId: string): Promise<boolean> => {
    if (!user || user.id !== playerId) return false

    try {
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*, match_participants(user_id)")
        .eq("id", matchId)
        .single()

      if (matchError || !match) return false

      if (match.status !== "waiting" || match.match_participants.length >= match.max_players) {
        return false
      }

      // Check balance and deduct wager
      if (match.wager_amount > 0) {
        if (user.balance < match.wager_amount) return false

        const { error: balanceError } = await supabase
          .from("profiles")
          .update({ balance: user.balance - match.wager_amount })
          .eq("id", user.id)

        if (balanceError) return false

        // Record transaction
        await supabase.from("transactions").insert({
          user_id: user.id,
          amount: -match.wager_amount,
          transaction_type: "wager",
          description: "Match wager deducted",
        })
      }

      const { error: participantError } = await supabase.from("match_participants").insert({
        match_id: matchId,
        user_id: playerId,
      })

      if (participantError) return false

      await refreshMatches()
      await refreshPublicMatches()
      return true
    } catch (error) {
      console.error("[v0] Error joining match:", error)
      return false
    }
  }

  const startMatch = async (matchId: string, playerId: string): Promise<boolean> => {
    if (!user || user.id !== playerId) return false

    try {
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*, match_participants(user_id)")
        .eq("id", matchId)
        .single()

      if (matchError || !match) return false

      const participantCount = match.match_participants.length
      if (participantCount === match.max_players && match.status === "waiting") {
        const { error: updateError } = await supabase
          .from("matches")
          .update({ status: "in-progress" })
          .eq("id", matchId)

        if (updateError) return false

        await refreshMatches()

        // Set as current match
        const updatedMatch = matches.find((m) => m.id === matchId)
        if (updatedMatch) {
          setCurrentMatch({ ...updatedMatch, status: "in-progress" })
        }

        return true
      }

      return false
    } catch (error) {
      console.error("[v0] Error starting match:", error)
      return false
    }
  }

  const submitScore = async (matchId: string, playerId: string, hole: number, strokes: number): Promise<boolean> => {
    if (!user || user.id !== playerId) return false

    try {
      const { data: matchHole, error: holeError } = await supabase
        .from("match_holes")
        .select("id")
        .eq("match_id", matchId)
        .eq("hole_number", hole)
        .single()

      if (holeError || !matchHole) return false

      // Upsert score
      const { error: scoreError } = await supabase.from("match_scores").upsert({
        match_hole_id: matchHole.id,
        player_id: playerId,
        strokes,
        confirmed: false,
      })

      if (scoreError) return false

      await refreshMatches()
      return true
    } catch (error) {
      console.error("[v0] Error submitting score:", error)
      return false
    }
  }

  const confirmScore = async (matchId: string, playerId: string, hole: number): Promise<boolean> => {
    if (!user || user.id !== playerId) return false

    try {
      const { data: matchHole, error: holeError } = await supabase
        .from("match_holes")
        .select("id")
        .eq("match_id", matchId)
        .eq("hole_number", hole)
        .single()

      if (holeError || !matchHole) return false

      const { error: confirmError } = await supabase
        .from("match_scores")
        .update({ confirmed: true })
        .eq("match_hole_id", matchHole.id)
        .eq("player_id", playerId)

      if (confirmError) return false

      // Check if hole is complete and update match status
      const { data: allScores } = await supabase
        .from("match_scores")
        .select("confirmed")
        .eq("match_hole_id", matchHole.id)

      const { data: participantCount } = await supabase
        .from("match_participants")
        .select("user_id", { count: "exact" })
        .eq("match_id", matchId)

      if (
        allScores &&
        participantCount &&
        allScores.length === participantCount.length &&
        allScores.every((s) => s.confirmed)
      ) {
        // Mark hole as completed
        await supabase.from("match_holes").update({ completed: true }).eq("id", matchHole.id)

        // Check if match is complete and handle completion
        const { data: match } = await supabase
          .from("matches")
          .select("current_hole, course_id")
          .eq("id", matchId)
          .single()

        if (match) {
          const course = SAMPLE_COURSES.find((c) => c.id === match.course_id)
          const nextHole = match.current_hole + 1

          if (nextHole > (course?.holes || 18)) {
            // Match complete - calculate winner and distribute prizes
            await completeMatch(matchId)
          } else {
            // Move to next hole
            await supabase.from("matches").update({ current_hole: nextHole }).eq("id", matchId)
          }
        }
      }

      await refreshMatches()
      return true
    } catch (error) {
      console.error("[v0] Error confirming score:", error)
      return false
    }
  }

  const completeMatch = async (matchId: string) => {
    try {
      const { data: match, error } = await supabase
        .from("matches")
        .select(`
          *,
          match_participants(user_id),
          match_holes(
            hole_number,
            par,
            match_scores(player_id, strokes)
          )
        `)
        .eq("id", matchId)
        .single()

      if (error || !match) return

      // Calculate winner based on game type
      const participants = match.match_participants.map((p: any) => ({ id: p.user_id }))
      const holes = match.match_holes.map((h: any) => ({
        number: h.hole_number,
        par: h.par,
        scores: h.match_scores.map((s: any) => ({
          playerId: s.player_id,
          strokes: s.strokes,
          confirmed: true,
        })),
      }))

      const winner = calculateWinner(match.game_type as GameType, holes, participants)
      const totalPrize = Number(match.wager_amount) * participants.length

      // Update match as completed
      await supabase
        .from("matches")
        .update({
          status: "completed",
          winner: winner,
        })
        .eq("id", matchId)

      // Distribute prize to winner
      if (totalPrize > 0 && winner) {
        const { data: winnerProfile } = await supabase.from("profiles").select("balance").eq("id", winner).single()

        if (winnerProfile) {
          await supabase
            .from("profiles")
            .update({ balance: Number(winnerProfile.balance) + totalPrize })
            .eq("id", winner)

          // Record transaction
          await supabase.from("transactions").insert({
            user_id: winner,
            amount: totalPrize,
            transaction_type: "winnings",
            description: "Match winnings",
            match_id: matchId,
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error completing match:", error)
    }
  }

  const getMatch = (matchId: string): Match | null => {
    return matches.find((m) => m.id === matchId) || null
  }

  return (
    <MatchContext.Provider
      value={{
        matches,
        currentMatch,
        publicMatches,
        userMatches,
        isLoadingPublic,
        refreshPublicMatches,
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

export function useMatch() {
  const context = useContext(MatchContext)
  if (context === undefined) {
    throw new Error("useMatch must be used within a MatchProvider")
  }
  return context
}

export { SAMPLE_COURSES }
