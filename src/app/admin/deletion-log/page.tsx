"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, MessageSquare, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

interface DeletionLog {
  id: string
  item_id: string
  item_type: 'review' | 'discussion'
  deletion_reason: string
  deleted_by: string
  deleted_at: string
  original_title: string | null
  original_content: string | null
  author_id: string
  deleted_by_name?: string
  author_name?: string
}

export default function DeletionLogPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [deletionLogs, setDeletionLogs] = useState<DeletionLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      router.push('/')
      return
    }
    fetchDeletionLogs()
  }, [user, router])

  const fetchDeletionLogs = async () => {
    const { data, error } = await supabase
      .from('deletion_log')
      .select('*')
      .order('deleted_at', { ascending: false })

    if (error) {
      // If table doesn't exist, just show empty state
      setDeletionLogs([])
    } else if (data) {
      // Fetch profile names separately
      const userIds = [...new Set([...data.map(d => d.deleted_by), ...data.map(d => d.author_id).filter(Boolean)])]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || [])

      const logs = data.map(log => ({
        ...log,
        deleted_by_name: profileMap.get(log.deleted_by) || 'Unknown',
        author_name: log.author_id ? (profileMap.get(log.author_id) || 'Unknown') : 'Unknown'
      }))
      setDeletionLogs(logs)
    } else {
      setDeletionLogs([])
    }
    setLoading(false)
  }

  const filteredLogs = deletionLogs.filter(log =>
    log.deletion_reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.original_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.original_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.item_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Deletion Log</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Deleted Items History</CardTitle>
              <div className="w-64">
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No deletion logs found</p>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {log.item_type === 'review' ? (
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-purple-500" />
                          )}
                          <span className="font-semibold capitalize">{log.item_type}</span>
                          <span className="text-sm text-gray-500">deleted</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(log.deleted_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {log.original_title && (
                        <div className="mb-2">
                          <span className="text-sm font-medium">Title: </span>
                          <span className="text-sm">{log.original_title}</span>
                        </div>
                      )}

                      {log.original_content && (
                        <div className="mb-4">
                          <span className="text-sm font-medium">Content: </span>
                          <p className="text-sm text-gray-600 mt-1">{log.original_content}</p>
                        </div>
                      )}

                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                        <span className="text-sm font-semibold text-red-700">Deletion Reason: </span>
                        <p className="text-sm text-red-600 mt-1">{log.deletion_reason}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Author: {log.author_name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          <span>Deleted by: {log.deleted_by_name || 'Unknown'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
