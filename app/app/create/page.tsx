"use client"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Card } from "@/components/ui/card"
import { Users, Globe, Bot } from "lucide-react"

export default function CreateMatch() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader />

      <div className="p-4">
        <h1 className="text-3xl font-bold mb-8">Create Match</h1>

        <div className="space-y-4">
          {/* Play Against Friends */}
          <Card
            className="p-6 bg-white rounded-3xl cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/app/create/friends")}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-teal-700" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Play Against Friends</h2>
                <p className="text-gray-600">Invite your golf buddies for a private match</p>
              </div>
            </div>
          </Card>

          {/* Challenge the Field */}
          <Card
            className="p-6 bg-white rounded-3xl cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/app/create/public")}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Globe className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Challenge the Field</h2>
                <p className="text-gray-600">Post an open challenge for anyone to join</p>
              </div>
            </div>
          </Card>

          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-3 font-medium">Developmental Use:</p>
            <Card
              className="p-6 bg-blue-50 border-blue-200 rounded-3xl cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push("/app/create/bot")}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 text-blue-900">Play vs. Bot</h2>
                  <p className="text-blue-700">Practice and test gameplay against AI opponent</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
