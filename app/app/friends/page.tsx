"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"
import { useFriends } from "@/lib/friends"
import { useToast } from "@/hooks/use-toast"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"

export default function FriendsPage() {
  const { user } = useAuth()
  const {
    friends,
    friendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    searchUsers,
    getFriendStats,
    refreshFriends,
  } = useFriends()
  const router = useRouter()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    refreshFriends()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      const results = searchUsers(searchQuery)
      setSearchResults(results)
      setIsSearching(false)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, searchUsers])

  if (!user) {
    router.push("/")
    return null
  }

  const pendingRequests = friendRequests.filter((req) => req.toUserId === user.id && req.status === "pending")
  const sentRequests = friendRequests.filter((req) => req.fromUserId === user.id && req.status === "pending")

  const handleSendRequest = async (username: string) => {
    const success = await sendFriendRequest(username)
    if (success) {
      toast({
        title: "Friend Request Sent",
        description: `Request sent to ${username}`,
      })
      setSearchQuery("")
    } else {
      toast({
        title: "Failed to Send Request",
        description: "Unable to send friend request",
        variant: "destructive",
      })
    }
  }

  const handleAcceptRequest = async (requestId: string, username: string) => {
    const success = await acceptFriendRequest(requestId)
    if (success) {
      toast({
        title: "Friend Added",
        description: `${username} is now your friend!`,
      })
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    const success = await declineFriendRequest(requestId)
    if (success) {
      toast({
        title: "Request Declined",
        description: "Friend request declined",
      })
    }
  }

  const handleRemoveFriend = async (friendId: string, username: string) => {
    const success = await removeFriend(friendId)
    if (success) {
      toast({
        title: "Friend Removed",
        description: `${username} removed from friends`,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-primary mb-6">Friends</h1>

        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
            <TabsTrigger value="requests">Requests ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({sentRequests.length})</TabsTrigger>
            <TabsTrigger value="search">Add Friends</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No friends yet</p>
                  <Button onClick={() => document.querySelector('[value="search"]')?.click()}>Add Friends</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {friends.map((friend) => {
                  const stats = getFriendStats(friend.id)
                  return (
                    <Card key={friend.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{friend.username}</CardTitle>
                            <CardDescription>Balance: ${friend.balance}</CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFriend(friend.id, friend.username)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {stats && (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Matches Played:</span>
                              <span>{stats.matchesPlayed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Matches Won:</span>
                              <span>{stats.matchesWon}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Win Rate:</span>
                              <span>
                                {stats.matchesPlayed > 0
                                  ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100)
                                  : 0}
                                %
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Net Earnings:</span>
                              <span className={stats.totalEarnings >= 0 ? "text-green-600" : "text-red-600"}>
                                ${stats.totalEarnings}
                              </span>
                            </div>
                          </div>
                        )}
                        <Button
                          className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                          onClick={() => router.push("/app/create")}
                        >
                          Challenge to Match
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No pending friend requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="flex justify-between items-center py-4">
                      <div>
                        <p className="font-semibold">{request.fromUsername}</p>
                        <p className="text-sm text-muted-foreground">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id, request.fromUsername)}
                          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        >
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeclineRequest(request.id)}>
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No sent requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="flex justify-between items-center py-4">
                      <div>
                        <p className="font-semibold">{request.toUsername}</p>
                        <p className="text-sm text-muted-foreground">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Friends</CardTitle>
                <CardDescription>Search for users by username</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Username</Label>
                    <Input
                      id="search"
                      placeholder="Enter username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Search Results</h3>
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-semibold">{user.username}</p>
                            <p className="text-sm text-muted-foreground">Balance: ${user.balance}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSendRequest(user.username)}
                            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                          >
                            Add Friend
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery && searchResults.length === 0 && !isSearching && (
                    <p className="text-muted-foreground text-center py-4">No users found with that username</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  )
}
