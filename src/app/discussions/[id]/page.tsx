"use client"

import { useState, useEffect, use } from "react"
import { notFound } from "next/navigation"
import { MessageSquare, Clock, Heart, Send, User, Edit2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Discussion, Reply } from "@/types"

export default function DiscussionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editTags, setEditTags] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    fetchDiscussion()
    fetchReplies()
  }, [unwrappedParams.id])

  const fetchDiscussion = async () => {
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .eq('id', unwrappedParams.id)
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
      .eq('discussion_id', unwrappedParams.id)
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
        discussion_id: unwrappedParams.id,
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

  const handleStartEdit = () => {
    if (!discussion) return
    setEditTitle(discussion.title)
    setEditContent(discussion.content)
    setEditCategory(discussion.category)
    setEditTags(discussion.tags.join(', '))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle("")
    setEditContent("")
    setEditCategory("")
    setEditTags("")
    setEditError("")
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !discussion) return

    setEditSubmitting(true)
    setEditError("")

    const tagsArray = editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

    const { error } = await supabase
      .from('discussions')
      .update({
        title: editTitle,
        content: editContent,
        category: editCategory,
        tags: tagsArray,
      })
      .eq('id', unwrappedParams.id)
      .eq('author_id', user.id)

    if (error) {
      setEditError(error.message)
    } else {
      setIsEditing(false)
      fetchDiscussion()
    }

    setEditSubmitting(false)
  }

  const handleDelete = async () => {
    if (!user || !discussion) return

    const { error } = await supabase
      .from('discussions')
      .delete()
      .eq('id', unwrappedParams.id)
      .eq('author_id', user.id)

    if (error) {
      alert('Failed to delete discussion: ' + error.message)
    } else {
      // Redirect to discussions page
      window.location.href = '/discussions'
    }
  }

  const isAuthor = user && discussion && user.id === discussion.author.id

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
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  {discussion.category}
                </span>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeAgo(discussion.createdAt)}
                </div>
              </div>
              {isAuthor && (
                <div className="flex gap-2">
                  {!isEditing && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartEdit}
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDeleting(true)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    minLength={5}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    required
                    minLength={10}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                  <Input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="e.g., espresso, v60, beginner"
                  />
                </div>
                {editError && (
                  <p className="text-sm text-red-600">{editError}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={editSubmitting} className="bg-green-600 hover:bg-green-700">
                    {editSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={editSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <h1 className="text-4xl font-bold mb-4">{discussion.title}</h1>
            )}

            {isDeleting && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-red-900">Delete Discussion</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Are you sure you want to delete this discussion? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Delete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleting(false)}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
            <h2 className="text-2xl font-bold mb-4">Replies ({replies.length})</h2>

            {replies.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No replies yet. Be the first to respond!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
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
