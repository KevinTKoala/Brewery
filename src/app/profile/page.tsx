"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, MessageSquare, Star, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Review, Discussion, Reply } from "@/types"

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchUserData()
  }, [user])

  const fetchUserData = async () => {
    if (!user) return

    // Fetch user's reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (reviewsData) {
      setReviews(reviewsData.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        targetId: r.target_id,
        targetType: r.target_type,
        rating: r.rating,
        title: r.title,
        content: r.content,
        userName: user.name,
        helpfulCount: r.helpful_count,
        createdAt: r.created_at,
      })))
    }

    // Fetch user's discussions
    const { data: discussionsData } = await supabase
      .from('discussions')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })

    if (discussionsData) {
      setDiscussions(discussionsData.map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        author: {
          id: user.id,
          name: user.name,
          avatar: undefined,
        },
        category: d.category,
        tags: d.tags,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        replyCount: d.reply_count,
        viewCount: d.view_count,
        likes: d.likes,
      })))
    }

    // Fetch user's replies
    const { data: repliesData } = await supabase
      .from('replies')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })

    if (repliesData) {
      setReplies(repliesData.map((r: any) => ({
        id: r.id,
        discussionId: r.discussion_id,
        author: {
          id: user.id,
          name: user.name,
          avatar: undefined,
        },
        content: r.content,
        likes: r.likes,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })))
    }

    setLoading(false)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Joined {new Date(user.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{reviews.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Discussions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{discussions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Replies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{replies.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Your Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <h3 className="font-medium">{review.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{review.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Discussions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {discussions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No discussions yet</p>
              ) : (
                <div className="space-y-4">
                  {discussions.slice(0, 5).map((discussion) => (
                    <div key={discussion.id} className="border-b pb-4 last:border-0">
                      <h3 className="font-medium">{discussion.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{discussion.content.substring(0, 100)}...</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(discussion.createdAt).toLocaleDateString()} • {discussion.replyCount} replies
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Replies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {replies.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No replies yet</p>
              ) : (
                <div className="space-y-4">
                  {replies.slice(0, 5).map((reply) => (
                    <div key={reply.id} className="border-b pb-4 last:border-0">
                      <p className="text-sm text-gray-700">{reply.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
