import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/lib/auth"
import { MatchProvider } from "@/lib/match"
import { FriendsProvider } from "@/lib/friends"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Showdown",
  description: "Challenge friends to golf matches and compete for prizes",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Suspense fallback={null}>
          <AuthProvider>
            <MatchProvider>
              <FriendsProvider>{children}</FriendsProvider>
            </MatchProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  )
}
