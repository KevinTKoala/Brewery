"use client"

import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { MessageSquare, Clock, Heart, Send, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Discussion, Reply } from "@/types"

export default function DiscussionDetailPage({ params }: { params: { id: string } }) {
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    fetchDiscussion()
    fetchReplies()
  }, [params.id])

  const fetchDiscussion = async () => {
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (data) {
      setDiscussion({
        id: data.id,
        title: data.title,
        content: data.content,
        author: {
          id: data.author_id,
          name: data.author_id, // Will be updated with profile name
          avatar: undefined,
        },
        category: data.category,
        tags: data.tags,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        replyCount: data.reply_count,
        viewCount: data.view_count,
        likes: data.likes,
      })
    }
    setLoading(false)
  }

  const fetchReplies = async () => {
    const { data, error } = await supabase
      .from('replies')
      .select('*')
      .eq('discussion_id', params.id)
      .order('created_at', { ascending: false })

    if (data) {
      setReplies(data.map((r: any) => ({
        id: r.id,
        discussionId: r.discussion_id,
        author: {
          id: r.author_id,
          name: r.author_id, // Will be updated with profile name
          avatar: undefined,
        },
        content: r.content,
        likes: r.likes,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })))
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setSubmitError("Please log in to submit a reply")
      return
    }

    setSubmitting(true)
    setSubmitError("")

    const { error } = await supabase
      .from('replies')
      .insert({
        discussion_id: params.id,
        author_id: user.id,
        content: replyContent,
      })

    if (error) {
      setSubmitError(error.message)
    } else {
      setReplyContent("")
      fetchReplies()
      fetchDiscussion() // To update reply count
    }

    setSubmitting(false)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    return "Just now"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!discussion) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                {discussion.category}
              </span>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {formatTimeAgo(discussion.createdAt)}
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4">{discussion.title}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="font-medium">{discussion.author.name}</p>
                  <p className="text-xs text-gray-500">Original poster</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {discussion.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                {discussion.replyCount} replies
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                {discussion.likes} likes
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {discussion.viewCount} views
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-gray-700 text-lg leading-relaxed">{discussion.content}</p>
            </CardContent>
          </Card>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Replies ({discussionReplies.length})</h2>

            {discussionReplies.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No replies yet. Be the first to respond!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {discussionReplies.map((reply) => (
                  <Card key={reply.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{reply.author.name}</p>
                              <p className="text-xs text-gray-500">{formatTimeAgo(reply.createdAt)}</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Heart className="h-4 w-4 mr-2" />
                              {reply.likes}
                            </Button>
                          </div>
                          <p className="text-gray-700">{reply.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Add a Reply</h3>
              <form onSubmit={handleSubmitReply}>
                <div className="flex gap-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      className="flex-1"
                      required
                      minLength={5}
                    />
                    <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {submitError && (
                  <p className="text-sm text-red-600 mt-2">{submitError}</p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
