"use client"

import { Search, MessageCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useState } from "react"
import { MessagesModal } from "./messages-modal"
import { WalletModal } from "./wallet-modal"
import Image from "next/image"

export function AppHeader() {
  const { user } = useAuth()
  const [showMessages, setShowMessages] = useState(false)
  const [showWallet, setShowWallet] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-teal-700 px-4 py-3 z-50">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Image src="/images/showdown-logo.png" alt="Showdown" width={32} height={32} className="w-8 h-8" />
          </div>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-200 w-5 h-5" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-teal-600/50 border border-teal-500 rounded-full py-3 pl-11 pr-4 text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Balance */}
          <button onClick={() => setShowWallet(true)} className="text-white font-semibold text-lg">
            ${user?.balance || 0}
          </button>

          {/* Messages */}
          <button onClick={() => setShowMessages(true)} className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      <MessagesModal open={showMessages} onClose={() => setShowMessages(false)} />
      <WalletModal open={showWallet} onClose={() => setShowWallet(false)} />
    </>
  )
}
