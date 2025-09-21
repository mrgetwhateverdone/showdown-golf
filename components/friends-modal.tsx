"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, UserPlus, UserMinus } from "lucide-react"
import { useAuth } from "@/lib/auth"

interface FriendsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FriendsModal({ isOpen, onClose }: FriendsModalProps) {
  const { user, updateUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    // Search for users by username
    const users = JSON.parse(localStorage.getItem("golf-users") || "[]")
    const results = users.filter(
      (u: any) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
        u.id !== user?.id &&
        !user?.friends?.includes(u.id),
    )
    setSearchResults(results)
  }

  const addFriend = (friendId: string) => {
    if (!user) return

    const updatedFriends = [...(user.friends || []), friendId]
    updateUser({ friends: updatedFriends })

    // Remove from search results
    setSearchResults((results) => results.filter((r) => r.id !== friendId))
  }

  const removeFriend = (friendId: string) => {
    if (!user) return

    const updatedFriends = user.friends?.filter((id) => id !== friendId) || []
    updateUser({ friends: updatedFriends })
  }

  const getFriendDetails = () => {
    if (!user?.friends) return []

    const users = JSON.parse(localStorage.getItem("golf-users") || "[]")
    return user.friends.map((friendId) => users.find((u: any) => u.id === friendId)).filter(Boolean)
  }

  const friends = getFriendDetails()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Friends</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 bg-teal-500">
                        <AvatarFallback className="text-white text-xs">
                          {result.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{result.username}</span>
                    </div>
                    <Button size="sm" onClick={() => addFriend(result.id)}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Friends */}
          <div className="space-y-2">
            <h3 className="font-medium">Your Friends ({friends.length})</h3>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-600">No friends yet. Search to add some!</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 bg-teal-500">
                        <AvatarFallback className="text-white text-xs">
                          {friend.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{friend.username}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFriend(friend.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
