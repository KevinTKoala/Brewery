"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, MessageSquare, Trash2, Eye, Edit2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

interface Discussion {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  author: {
    id: string
    name: string
    avatar?: string
  }
  replyCount: number
  viewCount: number
  likes: number
  createdAt: string
  updatedAt: string
}

export default function AdminDiscussionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
  })

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchDiscussions()
  }, [user, router])

  const fetchDiscussions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setDiscussions(data.map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        category: d.category,
        tags: d.tags || [],
        author: {
          id: d.user_id,
          name: d.user_id, // Will be updated with profile name
        },
        replyCount: d.reply_count,
        viewCount: d.view_count,
        likes: d.likes,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })))
    }
    setLoading(false)
  }

  const filteredDiscussions = discussions.filter(discussion =>
    discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discussion.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discussion.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteDiscussion = async (discussionId: string) => {
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

  const handleUpdateDiscussion = async () => {
    if (!selectedDiscussion) return

    setUpdating(true)
    const tagsArray = editForm.tags.split(',').map(s => s.trim()).filter(s => s)

    const { error } = await supabase
      .from('discussions')
      .update({
        title: editForm.title,
        content: editForm.content,
        category: editForm.category,
        tags: tagsArray,
      })
      .eq('id', selectedDiscussion.id)

    if (error) {
      alert('Failed to update discussion: ' + error.message)
    } else {
      setShowEditModal(false)
      setSelectedDiscussion(null)
      fetchDiscussions()
    }
    setUpdating(false)
  }

  const openEditModal = (discussion: Discussion) => {
    setSelectedDiscussion(discussion)
    setEditForm({
      title: discussion.title,
      content: discussion.content,
      category: discussion.category,
      tags: discussion.tags.join(', '),
    })
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold mb-2">Manage Discussions</h1>
              <p className="text-gray-600">View and manage all platform discussions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Discussions ({filteredDiscussions.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-gray-600">Discussion</th>
                    <th className="text-left p-4 font-medium text-gray-600">Category</th>
                    <th className="text-left p-4 font-medium text-gray-600">Replies</th>
                    <th className="text-left p-4 font-medium text-gray-600">Views</th>
                    <th className="text-left p-4 font-medium text-gray-600">Likes</th>
                    <th className="text-left p-4 font-medium text-gray-600">Created</th>
                    <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiscussions.map((discussion) => (
                    <tr key={discussion.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium block">{discussion.title}</span>
                            <span className="text-xs text-gray-500">{discussion.content.substring(0, 50)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {discussion.category}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{discussion.replyCount}</td>
                      <td className="p-4 text-gray-600">{discussion.viewCount}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                          <span className="font-medium">{discussion.likes}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {new Date(discussion.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(discussion)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/discussions/${discussion.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDiscussion(discussion.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Discussion Modal */}
      {showEditModal && selectedDiscussion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Discussion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md min-h-32"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Input
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                  <Input
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    placeholder="e.g., espresso, brewing, equipment"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateDiscussion} disabled={updating}>
                    {updating ? 'Updating...' : 'Update Discussion'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
