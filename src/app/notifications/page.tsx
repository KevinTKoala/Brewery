"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Trash2, Calendar, Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

interface Notification {
  id: string
  type: 'deletion' | 'warning' | 'info' | 'system'
  title: string
  message: string
  related_item_type?: string
  related_item_id?: string
  deletion_reason?: string
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchNotifications()
  }, [user, router])

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      // Error fetching notifications
    } else {
      setNotifications(data || [])
    }
    setLoading(false)
  }

  const markAsRead = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        // Error marking notification as read
      } else {
        fetchNotifications()
      }
    } finally {
      setActionLoading(null)
    }
  }

  const markAllAsRead = async () => {
    setActionLoading('mark-all')
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      if (error) {
        // Error marking all notifications as read
      } else {
        fetchNotifications()
      }
    } finally {
      setActionLoading(null)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        // Error deleting notification
      } else {
        fetchNotifications()
      }
    } finally {
      setActionLoading(null)
    }
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Bell className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={actionLoading === 'mark-all'}
            >
              {actionLoading === 'mark-all' ? (
                <>
                  <span className="h-4 w-4 mr-2 animate-spin">⏳</span>
                  Marking...
                </>
              ) : (
                'Mark All as Read'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`border-l-4 ${
                  !notification.is_read ? 'border-l-blue-500 bg-blue-50' : 'border-l-gray-300'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {notification.type === 'deletion' && <AlertCircle className="h-5 w-5 text-red-500" />}
                      {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                      {notification.type === 'info' && <Bell className="h-5 w-5 text-blue-500" />}
                      {notification.type === 'system' && <Bell className="h-5 w-5 text-gray-500" />}
                      <span className={`font-semibold ${!notification.is_read ? 'text-blue-700' : 'text-gray-700'}`}>
                        {notification.title}
                      </span>
                      {!notification.is_read && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{notification.message}</p>

                  {notification.deletion_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                      <span className="text-sm font-semibold text-red-700">Deletion Reason: </span>
                      <p className="text-sm text-red-600 mt-1">{notification.deletion_reason}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => markAsRead(notification.id)}
                          disabled={actionLoading === notification.id}
                        >
                          {actionLoading === notification.id ? (
                            <span className="h-4 w-4 mr-2 animate-spin">⏳</span>
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Mark as Read
                        </Button>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteNotification(notification.id)}
                      disabled={actionLoading === notification.id}
                      className="text-red-500 hover:text-red-700"
                    >
                      {actionLoading === notification.id ? (
                        <span className="h-4 w-4 animate-spin">⏳</span>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
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
