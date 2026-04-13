"use client"

import { useState } from "react"
import { Search, MessageSquare, TrendingUp, Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { discussions } from "@/lib/data"
import Link from "next/link"

export default function DiscussionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-5 w-5" />
              New Discussion
            </Button>
          </div>

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
        {filteredDiscussions.length === 0 ? (
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
