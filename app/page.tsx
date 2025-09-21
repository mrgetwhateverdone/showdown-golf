"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const { user, login, signup, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Redirect if already logged in
  if (user) {
    router.push("/app")
    return null
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    let success = false
    if (isLogin) {
      success = await login(email, password)
      if (!success) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        })
      }
    } else {
      if (!username.trim()) {
        toast({
          title: "Username Required",
          description: "Please enter a username",
          variant: "destructive",
        })
        return
      }
      success = await signup(email, password, username)
      if (!success) {
        toast({
          title: "Signup Failed",
          description: "User already exists",
          variant: "destructive",
        })
      }
    }

    if (success) {
      router.push("/app")
    }
  }

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Image src="/images/showdown-logo.jpg" alt="Showdown" width={48} height={48} className="w-12 h-12" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                {isLogin ? "Welcome Back" : "Join Showdown"}
              </CardTitle>
              <CardDescription>
                {isLogin ? "Sign in to your account" : "Create your account and get $1,000 free"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowAuth(false)}
                  className="text-muted-foreground hover:underline text-sm"
                >
                  Back to home
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Image src="/images/showdown-logo.jpg" alt="Showdown" width={80} height={80} className="w-20 h-20" />
          </div>
          <h1 className="text-5xl font-bold text-primary mb-4">Showdown</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Challenge friends to golf matches, compete in tournaments, and win real prizes. The ultimate golf
            competition app.
          </p>
          <Button
            size="lg"
            onClick={() => setShowAuth(true)}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-8 py-3"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Challenge Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create matches with friends or join open challenges. Multiple game types including stroke play, match
                play, and skins.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Real-time Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track scores hole by hole with both players confirming results. Live leaderboards and match updates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Win Prizes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Compete for prize pools, climb leaderboards, and earn rewards. Start with $1,000 free when you sign up.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
