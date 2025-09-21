"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth"
import { useFriends } from "@/lib/friends"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, MapPin, Trophy, Target, DollarSign, Star } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface PlayerProfile {
  id: string
  display_name: string
  full_name: string
  email: string
  handicap: number
  balance: number
  created_at: string
}

interface Review {
  id: string
  reviewer_id: string
  reviewed_id: string
  rating: number
  review_type: string
  comment: string
  created_at: string
  reviewer_name: string
}

export default function PlayerProfilePage() {
  const { user } = useAuth()
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { friends, sendFriendRequest, friendRequests } = useFriends()

  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    review_type: "general",
    comment: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (id) {
      fetchPlayerProfile()
      fetchReviews()
    }
  }, [id])

  const fetchPlayerProfile = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Failed to load player profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          reviewer:profiles!reviewer_id(display_name)
        `)
        .eq("reviewed_id", id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const reviewsWithNames = data.map((review) => ({
        ...review,
        reviewer_name: review.reviewer.display_name,
      }))

      setReviews(reviewsWithNames)
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const handleChallenge = () => {
    router.push("/app/create/friends")
  }

  const handleAddFriend = async () => {
    if (!profile) return

    const success = await sendFriendRequest(profile.display_name)
    if (success) {
      toast({
        title: "Friend Request Sent",
        description: `Request sent to ${profile.display_name}`,
      })
    } else {
      toast({
        title: "Failed to Send Request",
        description: "Unable to send friend request",
        variant: "destructive",
      })
    }
  }

  const handleSubmitReview = async () => {
    if (!user || !profile) return

    try {
      const { error } = await supabase.from("reviews").upsert({
        reviewer_id: user.id,
        reviewed_id: profile.id,
        rating: newReview.rating,
        review_type: newReview.review_type,
        comment: newReview.comment,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Review Submitted",
        description: "Your review has been posted successfully",
      })

      setShowReviewForm(false)
      setNewReview({ rating: 5, review_type: "general", comment: "" })
      fetchReviews()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading player profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Player not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id
  const isFriend = friends.some((friend) => friend.id === profile.id)
  const hasPendingRequest = friendRequests.some(
    (req) => req.toUserId === profile.id && req.fromUserId === user?.id && req.status === "pending",
  )

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-700 text-white p-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white hover:bg-green-600">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Player Profile</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card className="bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {getInitials(profile.display_name)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{profile.display_name}</h2>
                <div className="flex items-center gap-1 text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Kansas City, MO</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Passionate golfer who loves the competition. Always looking for a good match!
                </p>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">
                    {averageRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Handicap</span>
                </div>
                <p className="text-2xl font-bold">{profile.handicap}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Record</span>
                </div>
                <p className="text-2xl font-bold">15-3</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Home Course</span>
                </div>
                <p className="font-semibold">TPC Kansas City</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Earnings</span>
                </div>
                <p className="text-2xl font-bold">${profile.balance}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="space-y-3">
            {/* Challenge Button */}
            <Button
              onClick={handleChallenge}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl text-lg font-semibold"
            >
              Challenge
            </Button>

            {/* Add Friend Button */}
            <Button
              onClick={handleAddFriend}
              disabled={isFriend || hasPendingRequest}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-2xl text-lg font-semibold disabled:bg-gray-400"
            >
              {isFriend ? "Already Friends" : hasPendingRequest ? "Request Sent" : "Add Friend"}
            </Button>

            {/* Review Button */}
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl text-lg font-semibold"
            >
              Review
            </Button>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <Card className="bg-white rounded-3xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Write a Review</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })} className="p-1">
                        <Star
                          className={`w-6 h-6 ${
                            star <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Review Type</label>
                  <select
                    value={newReview.review_type}
                    onChange={(e) => setNewReview({ ...newReview, review_type: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="general">General</option>
                    <option value="stroke_play">Stroke Play</option>
                    <option value="match_play">Match Play</option>
                    <option value="skins">Skins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <Textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your experience playing with this golfer..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmitReview} className="flex-1">
                    Submit Review
                  </Button>
                  <Button variant="outline" onClick={() => setShowReviewForm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Section */}
        <Card className="bg-white rounded-3xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Reviews ({reviews.length})</h3>

            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(review.reviewer_name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{review.reviewer_name}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {review.review_type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
