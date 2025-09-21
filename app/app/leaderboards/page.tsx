"use client"

import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, Filter, Trophy } from "lucide-react"
import { useState } from "react"

export default function LeaderboardsPage() {
  const [selectedFilter, setSelectedFilter] = useState("Main Leaderboard")

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader />

      <div className="px-4 py-6 space-y-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900">Leaderboards</h1>

        {/* Filter Section */}
        <Card>
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-between text-left"
              onClick={() => {
                /* Filter functionality can be added later */
              }}
            >
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-medium">Filters</div>
                  <div className="text-sm text-gray-500">{selectedFilter}</div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Empty State */}
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">No Rankings Yet</h3>
            <p className="text-gray-600 text-balance max-w-sm mx-auto">
              Leaderboards will populate as players complete matches and earn rankings.
            </p>
          </div>
          <div className="pt-4">
            <p className="text-sm text-gray-500">Be the first to climb the leaderboard!</p>
          </div>
        </div>

        {/* Future Leaderboard Categories */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Available Leaderboards</h3>

          <Card className="opacity-60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Main Leaderboard</h4>
                  <p className="text-sm text-gray-600">Overall rankings by total earnings</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">0 players</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Weekly Rankings</h4>
                  <p className="text-sm text-gray-600">Top performers this week</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">0 players</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Monthly Champions</h4>
                  <p className="text-sm text-gray-600">Best players this month</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">0 players</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Pro Leaderboards</h4>
                  <p className="text-sm text-gray-600">Verified professionals only</p>
                </div>
                <div className="text-right">
                  <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pro Only</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
