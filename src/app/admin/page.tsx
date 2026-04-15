"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, MessageSquare, Store, Coffee, TrendingUp, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDiscussions: 0,
    totalRoasteries: 0,
    totalCafes: 0,
    totalReplies: 0,
  })

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchStats()
  }, [user, router])

  const fetchStats = async () => {
    setLoading(true)

    const [usersRes, discussionsRes, roasteriesRes, cafesRes, repliesRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('discussions').select('id', { count: 'exact', head: true }),
      supabase.from('roasteries').select('id', { count: 'exact', head: true }),
      supabase.from('cafes').select('id', { count: 'exact', head: true }),
      supabase.from('replies').select('id', { count: 'exact', head: true }),
    ])

    setStats({
      totalUsers: usersRes.count || 0,
      totalDiscussions: discussionsRes.count || 0,
      totalRoasteries: roasteriesRes.count || 0,
      totalCafes: cafesRes.count || 0,
      totalReplies: repliesRes.count || 0,
    })

    setLoading(false)
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your Brewery platform</p>
            </div>
            <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-full">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">Admin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Discussions</CardTitle>
              <MessageSquare className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalDiscussions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Replies</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalReplies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Roasteries</CardTitle>
              <Coffee className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalRoasteries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cafes</CardTitle>
              <Store className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCafes}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/discussions')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Manage Discussions
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/roasteries')}>
                <Coffee className="h-4 w-4 mr-2" />
                Manage Roasteries
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/cafes')}>
                <Store className="h-4 w-4 mr-2" />
                Manage Cafes
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/users')}>
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Database Status</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Auth Status</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Admin features coming soon: User management, content moderation, analytics dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
