"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, MessageSquare, Star, LogOut, Edit2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Review, Discussion, Reply } from "@/types"
import { ImageUpload } from "@/components/image-upload"

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [updateError, setUpdateError] = useState("")
  const [updateSuccess, setUpdateSuccess] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchUserData()
    setEditName(user.name)
    setEditEmail(user.email)
  }, [user])

  const fetchUserData = async () => {
    if (!user) return

    // Fetch user's profile to get avatar
    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profileData?.avatar_url) {
      setAvatarUrl(profileData.avatar_url)
    }

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
        image: r.image,
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateError("")
    setUpdateSuccess("")
    setUpdating(true)

    try {
      // Update profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          name: editName,
          avatar_url: avatarUrl
        })
        .eq('id', user.id)

      if (profileError) {
        throw profileError
      }

      // Update email if changed
      if (editEmail !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editEmail
        })

        if (emailError) {
          throw emailError
        }
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match")
        }

        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters")
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (passwordError) {
          throw passwordError
        }
      }

      setUpdateSuccess("Profile updated successfully!")
      setIsEditing(false)
      
      // Refresh user data
      window.location.reload()
    } catch (error: any) {
      setUpdateError(error.message || "Failed to update profile")
    } finally {
      setUpdating(false)
    }
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
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-green-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Joined {new Date(user.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
                  {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
                <Button onClick={handleLogout} variant="outline">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            {isEditing && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Profile Picture
                      </label>
                      <ImageUpload
                        onUploadComplete={(url) => setAvatarUrl(url)}
                        onUploadError={(error) => setUpdateError(error)}
                      />
                    </div>
                    <div>
                      <label htmlFor="name" className="text-sm font-medium mb-2 block">
                        Name
                      </label>
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="text-sm font-medium mb-2 block">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="text-sm font-medium mb-2 block">
                        New Password (optional)
                      </label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    {newPassword && (
                      <div>
                        <label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block">
                          Confirm New Password
                        </label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    {updateError && (
                      <p className="text-sm text-red-600">{updateError}</p>
                    )}
                    {updateSuccess && (
                      <p className="text-sm text-green-600">{updateSuccess}</p>
                    )}
                    <Button type="submit" disabled={updating} className="bg-green-600 hover:bg-green-700">
                      {updating ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
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
