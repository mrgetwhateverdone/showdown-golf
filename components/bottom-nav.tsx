"use client"

import { useRouter, usePathname } from "next/navigation"
import { Search, Layers, Crown, Trophy, User } from "lucide-react"

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { icon: Search, label: "Browse Match", path: "/app/browse" },
    { icon: Layers, label: "Create Match", path: "/app/create" },
    { icon: Crown, label: "Pro", path: "/app/pro" },
    { icon: Trophy, label: "Leaderboards", path: "/app/leaderboards" },
    { icon: User, label: "Profile", path: "/app/profile" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-teal-700 px-4 py-2 z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-3 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 ${
                isActive ? "bg-teal-600/50 rounded-lg" : ""
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-all duration-200 ${
                  isActive ? "text-amber-400 font-bold" : "text-white"
                }`}
              />
              <span
                className={`text-xs transition-all duration-200 ${
                  isActive ? "text-amber-400 font-bold" : "text-white"
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
