"use client"

import { useState, useEffect } from "react"
import { Search, MessageSquare, TrendingUp, Clock, Plus, ChevronDown, SlidersHorizontal, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Discussion } from "@/types"
import { useRouter } from "next/navigation"
import { ImageUpload } from "@/components/image-upload"
import { containsBannedWords, getBannedWords } from "@/lib/word-filter"

export default function DiscussionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"newest" | "most_replies" | "most_likes">("newest")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [showDiscussionForm, setShowDiscussionForm] = useState(false)
  const [discussionTitle, setDiscussionTitle] = useState("")
  const [discussionContent, setDiscussionContent] = useState("")
  const [discussionCategory, setDiscussionCategory] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [discussionTags, setDiscussionTags] = useState("")
  const [discussionImages, setDiscussionImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

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
        images: d.images,
      })))
    }
    setDataLoading(false)
  }

  useEffect(() => {
    fetchDiscussions()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const handleSubmitDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setSubmitError("Please log in to submit a discussion")
      return
    }

    // Check for banned words in title and content
    const titleBannedWords = getBannedWords(discussionTitle)
    const contentBannedWords = getBannedWords(discussionContent)

    if (titleBannedWords.length > 0 || contentBannedWords.length > 0) {
      const allBannedWords = [...new Set([...titleBannedWords, ...contentBannedWords])]
      setSubmitError(`Your discussion contains inappropriate language: ${allBannedWords.join(', ')}. Please remove these words and try again.`)
      return
    }

    setSubmitting(true)
    setSubmitError("")

    const tagsArray = discussionTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

    const categoryToSubmit = discussionCategory === "custom" ? customCategory : discussionCategory

    const { error } = await supabase
      .from('discussions')
      .insert({
        title: discussionTitle,
        content: discussionContent,
        author_id: user.id,
        category: categoryToSubmit,
        tags: tagsArray,
        images: discussionImages,
      })

    if (error) {
      setSubmitError(error.message)
    } else {
      setShowDiscussionForm(false)
      setDiscussionTitle("")
      setDiscussionContent("")
      setDiscussionCategory("")
      setCustomCategory("")
      setDiscussionTags("")
      setDiscussionImages([])
      fetchDiscussions()
    }

    setSubmitting(false)
  }

  const handleDeleteDiscussion = async (discussionId: string, authorId: string) => {
    if (!user) return

    // Only allow deletion if user is author, admin, or moderator
    if (user.id !== authorId && user.role !== 'admin' && user.role !== 'moderator') return

    if (!confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('discussions')
      .delete()
      .eq('id', discussionId)

    if (error) {
      alert('Failed to delete discussion: ' + error.message)
    } else {
      fetchDiscussions()
    }
  }

  const categories = Array.from(new Set(discussions.map((d) => d.category))).sort()
  const allTags = Array.from(new Set(discussions.flatMap((d) => d.tags))).sort()
  const selectedTags = discussionTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

  const toggleTag = (tag: string) => {
    const currentTags = discussionTags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    if (currentTags.includes(tag)) {
      setDiscussionTags(currentTags.filter(t => t !== tag).join(', '))
    } else {
      setDiscussionTags([...currentTags, tag].join(', '))
    }
  }

  const filteredDiscussions = discussions
    .filter((discussion) => {
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
    .sort((a, b) => {
      switch (sortBy) {
        case "most_replies":
          return b.replyCount - a.replyCount
        case "most_likes":
          return b.likes - a.likes
        case "newest":
        default:
          return 0 // Keep original order (newest from database)
      }
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
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Please be respectful:</span> Keep discussions friendly and constructive. We're all here to share our love for coffee!
                  </p>
                </div>
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
                    <select
                      id="category"
                      value={discussionCategory}
                      onChange={(e) => setDiscussionCategory(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    {discussionCategory === "custom" && (
                      <Input
                        className="mt-2"
                        placeholder="Enter custom category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        required
                      />
                    )}
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
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {allTags.map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          onClick={() => toggleTag(tag)}
                          size="sm"
                        >
                          #{tag}
                        </Button>
                      ))}
                    </div>
                    <Input
                      id="tags"
                      value={discussionTags}
                      onChange={(e) => setDiscussionTags(e.target.value)}
                      placeholder="Or add custom tags (comma-separated)"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Images
                    </label>
                    <ImageUpload
                      onUploadComplete={(url) => {
                        setDiscussionImages(prev => [...prev, url])
                      }}
                      onUploadError={(error) => setSubmitError(error)}
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

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-4">
              <div>
                <h3 className="font-medium mb-2 text-sm">Category</h3>
                <div className="flex gap-2 flex-wrap items-center">
                  <Button
                    variant={!selectedCategory ? "default" : "outline"}
                    onClick={() => setSelectedCategory(null)}
                    size="sm"
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

              <div>
                <h3 className="font-medium mb-2 text-sm">Sort By</h3>
                <div className="flex gap-2 flex-wrap items-center">
                  <Button
                    variant={sortBy === "newest" ? "default" : "outline"}
                    onClick={() => setSortBy("newest")}
                    size="sm"
                  >
                    Newest
                  </Button>
                  <Button
                    variant={sortBy === "most_replies" ? "default" : "outline"}
                    onClick={() => setSortBy("most_replies")}
                    size="sm"
                  >
                    Most Replies
                  </Button>
                  <Button
                    variant={sortBy === "most_likes" ? "default" : "outline"}
                    onClick={() => setSortBy("most_likes")}
                    size="sm"
                  >
                    Most Likes
                  </Button>
                </div>
              </div>
            </div>
          )}
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
              <Card key={discussion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Link href={`/discussions/${discussion.id}`}>
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
                      </Link>
                    </div>
                    {user && (user.id === discussion.author.id || user.role === 'admin' || user.role === 'moderator') && (
                      <div className="flex flex-col gap-2">
                        <Link href={`/discussions/${discussion.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDiscussion(discussion.id, discussion.author.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
