"use client"

import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Crown, DollarSign, Trophy, TrendingUp, Target, Users, Star } from "lucide-react"
import { useState } from "react"

export default function ProPage() {
  const [showComingSoon, setShowComingSoon] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader />

      <div className="px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Showdown Pro</h1>
          <p className="text-gray-600 text-balance">
            Unlock premium features and take your golf game to the next level
          </p>
        </div>

        {/* Membership Status */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-yellow-800">Free Member</h3>
              <p className="text-sm text-yellow-700">Upgrade to unlock all features</p>
            </div>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">Upgrade Now</Button>
          </CardContent>
        </Card>

        {/* Pro Features Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Pro Features</h2>

          {/* App Funded Matches */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">App Funded Matches</h3>
                    <p className="text-sm text-gray-600">
                      Join matches where Showdown puts up the prize money. No risk, all reward!
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">$99.99/year</span>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowComingSoon(true)}
              >
                <Crown className="w-4 h-4 mr-2" />
                Unlock Feature
              </Button>
            </CardContent>
          </Card>

          {/* Verified Pro Status */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Verified Pro Status</h3>
                    <p className="text-sm text-gray-600">Blue checkmark verification and enhanced profile features.</p>
                  </div>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">$99.99/year</span>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowComingSoon(true)}
              >
                <Crown className="w-4 h-4 mr-2" />
                Unlock Feature
              </Button>
            </CardContent>
          </Card>

          {/* Pro Leaderboards */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Pro Leaderboards</h3>
                    <p className="text-sm text-gray-600">
                      Compete against verified professional and scratch golfers in exclusive rankings.
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">$99.99/year</span>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowComingSoon(true)}
              >
                <Crown className="w-4 h-4 mr-2" />
                Unlock Feature
              </Button>
            </CardContent>
          </Card>

          {/* Coming Soon Features */}
          <div className="space-y-3">
            <Card className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Pro Coaching Access</h3>
                      <p className="text-sm text-gray-600">
                        Direct access to PGA professionals for lessons and swing analysis.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
              </CardContent>
            </Card>

            <Card className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Exclusive Tournaments</h3>
                      <p className="text-sm text-gray-600">Access to Pro-only tournaments with larger prize pools.</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
              </CardContent>
            </Card>

            <Card className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Pro Network</h3>
                      <p className="text-sm text-gray-600">
                        Connect with other verified professionals and top amateur players.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Ready to Go Pro?</h3>
            <p className="text-yellow-100">Join thousands of golfers already using Showdown Pro</p>
            <Button className="bg-white text-yellow-600 hover:bg-gray-100 font-semibold">Start Free Trial</Button>
            <p className="text-sm text-yellow-100">7-day free trial • Cancel anytime</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Feature Coming Soon</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <p className="text-center text-gray-600">
              This feature is currently in development and will be available soon!
            </p>
            <Button onClick={() => setShowComingSoon(false)} className="bg-green-600 hover:bg-green-700 text-white">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  )
}
