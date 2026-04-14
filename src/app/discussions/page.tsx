"use client"

import { useState, useEffect } from "react"
import { Search, MessageSquare, TrendingUp, Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Discussion } from "@/types"

export default function DiscussionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [showDiscussionForm, setShowDiscussionForm] = useState(false)
  const [discussionTitle, setDiscussionTitle] = useState("")
  const [discussionContent, setDiscussionContent] = useState("")
  const [discussionCategory, setDiscussionCategory] = useState("")
  const [discussionTags, setDiscussionTags] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    fetchDiscussions()
  }, [])

  const fetchDiscussions = async () => {
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setDiscussions(data.map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        author: {
          id: d.author_id,
          name: d.author_id, // Will be updated with profile name
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
    setLoading(false)
  }

  const handleSubmitDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setSubmitError("Please log in to submit a discussion")
      return
    }

    setSubmitting(true)
    setSubmitError("")

    const tagsArray = discussionTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

    const { error } = await supabase
      .from('discussions')
      .insert({
        title: discussionTitle,
        content: discussionContent,
        author_id: user.id,
        category: discussionCategory,
        tags: tagsArray,
      })

    if (error) {
      setSubmitError(error.message)
    } else {
      setShowDiscussionForm(false)
      setDiscussionTitle("")
      setDiscussionContent("")
      setDiscussionCategory("")
      setDiscussionTags("")
      fetchDiscussions()
    }

    setSubmitting(false)
  }

  const categories = Array.from(new Set(discussions.map((d) => d.category))).sort()

  const filteredDiscussions = discussions.filter((discussion) => {
    const matchesSearch =
      discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )

    const matchesCategory =
      !selectedCategory || discussion.category === selectedCategory

    return matchesSearch && matchesCategory
  })

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Community Discussions</h1>
              <p className="text-gray-600">
                Connect with fellow coffee enthusiasts and share your knowledge
              </p>
            </div>
            <Button onClick={() => setShowDiscussionForm(!showDiscussionForm)} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-5 w-5" />
              {showDiscussionForm ? "Cancel" : "New Discussion"}
            </Button>
          </div>

          {showDiscussionForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Discussion</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitDiscussion} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="text-sm font-medium mb-2 block">
                      Title
                    </label>
                    <Input
                      id="title"
                      value={discussionTitle}
                      onChange={(e) => setDiscussionTitle(e.target.value)}
                      placeholder="What's your question or topic?"
                      required
                      minLength={5}
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="text-sm font-medium mb-2 block">
                      Category
                    </label>
                    <Input
                      id="category"
                      value={discussionCategory}
                      onChange={(e) => setDiscussionCategory(e.target.value)}
                      placeholder="e.g., Brewing, Equipment, Beans"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="content" className="text-sm font-medium mb-2 block">
                      Content
                    </label>
                    <textarea
                      id="content"
                      value={discussionContent}
                      onChange={(e) => setDiscussionContent(e.target.value)}
                      placeholder="Share your thoughts, questions, or experiences..."
                      required
                      minLength={10}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="tags" className="text-sm font-medium mb-2 block">
                      Tags (comma-separated)
                    </label>
                    <Input
                      id="tags"
                      value={discussionTags}
                      onChange={(e) => setDiscussionTags(e.target.value)}
                      placeholder="e.g., espresso, v60, beginner"
                    />
                  </div>
                  {submitError && (
                    <p className="text-sm text-red-600">{submitError}</p>
                  )}
                  <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
                    {submitting ? "Submitting..." : "Submit Discussion"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading discussions...</p>
          </div>
        ) : filteredDiscussions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No discussions found matching your search.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredDiscussions.map((discussion) => (
              <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            {discussion.category}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(discussion.createdAt)}
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 hover:text-green-600 transition-colors">
                          {discussion.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {discussion.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">
                            by {discussion.author.name}
                          </span>
                          <span>•</span>
                          <div className="flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {discussion.replyCount} replies
                          </div>
                          <span>•</span>
                          <div className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {discussion.viewCount} views
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {discussion.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
