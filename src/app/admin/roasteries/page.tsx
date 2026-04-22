"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Coffee, Trash2, Eye, MapPin, Star, Edit2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { DatabaseRoastery, DatabaseReview } from "@/types"
import { useToast } from "@/lib/toast-context"
import { logDeletionWithNotification } from "@/lib/deletion-utils"

interface Roastery {
  id: string
  name: string
  location: string
  description: string
  rating: number
  reviewCount: number
  specialties: string[]
  website?: string
  phone?: string
  address?: string
  images: string[]
  created_at: string
}

export default function AdminRoasteriesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [roasteries, setRoasteries] = useState<Roastery[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoastery, setSelectedRoastery] = useState<Roastery | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    description: "",
    specialties: "",
    website: "",
    phone: "",
    address: "",
  })
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showEditReviewModal, setShowEditReviewModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [reviewEditForm, setReviewEditForm] = useState({
    rating: 5,
    title: "",
    content: ""
  })
  const [updatingReview, setUpdatingReview] = useState(false)
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false)
  const [deletionReason, setDeletionReason] = useState("")

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      router.push('/')
      return
    }
    fetchRoasteries()
  }, [user, router])

  const fetchRoasteries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('roasteries')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRoasteries(data.map((r: DatabaseRoastery) => ({
        id: r.id,
        name: r.name,
        location: r.location,
        description: r.description,
        rating: r.rating,
        reviewCount: r.review_count,
        specialties: r.specialties || [],
        website: r.website,
        phone: r.phone,
        address: r.address,
        images: r.images || [],
        created_at: r.created_at,
      })))
    }
    setLoading(false)
  }

  const filteredRoasteries = roasteries.filter(roastery =>
    roastery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roastery.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteRoastery = async (roasteryId: string) => {
    if (!confirm('Are you sure you want to delete this roastery? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('roasteries')
      .delete()
      .eq('id', roasteryId)

    if (error) {
      toast('Failed to delete roastery: ' + error.message, 'error')
    } else {
      fetchRoasteries()
    }
  }

  const handleUpdateRoastery = async () => {
    if (!selectedRoastery) return

    setUpdating(true)
    const specialtiesArray = editForm.specialties.split(',').map(s => s.trim()).filter(s => s)

    const { error } = await supabase
      .from('roasteries')
      .update({
        name: editForm.name,
        location: editForm.location,
        description: editForm.description,
        specialties: specialtiesArray,
        website: editForm.website || null,
        phone: editForm.phone || null,
        address: editForm.address || null,
      })
      .eq('id', selectedRoastery.id)

    if (error) {
      toast('Failed to update roastery: ' + error.message, 'error')
    } else {
      setShowEditModal(false)
      setSelectedRoastery(null)
      fetchRoasteries()
    }
    setUpdating(false)
  }

  const openEditModal = (roastery: Roastery) => {
    setSelectedRoastery(roastery)
    setEditForm({
      name: roastery.name,
      location: roastery.location,
      description: roastery.description,
      specialties: roastery.specialties.join(', '),
      website: roastery.website || '',
      phone: roastery.phone || '',
      address: roastery.address || '',
    })
    setShowEditModal(true)
  }

  const handleViewReviews = async (roastery: Roastery) => {
    setSelectedRoastery(roastery)
    setReviewsLoading(true)
    const { data: reviewsData, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('target_id', roastery.id)
      .eq('target_type', 'roastery')
      .order('created_at', { ascending: false })

    if (error) {
      toast('Failed to fetch reviews: ' + (error.message || 'Unknown error'), 'error')
      setReviews([])
    } else if (reviewsData) {
      const userIds = [...new Set(reviewsData.map((r: DatabaseReview) => r.user_id))]
      let profilesMap = new Map()

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds)

        if (profilesError) {
          // Error fetching profiles
        }

        profilesMap = new Map(profilesData?.map((p: { id: string; name?: string; avatar_url?: string }) => [p.id, p]) || [])
      }

      setReviews(reviewsData.map((r: DatabaseReview) => ({
        ...r,
        user: profilesMap.get(r.user_id)
      })))
    } else {
      setReviews([])
    }
    setReviewsLoading(false)
  }

  const openEditReviewModal = (review: DatabaseReview & { user?: { id: string; name?: string; avatar_url?: string } }) => {
    setSelectedReview(review)
    setReviewEditForm({
      rating: review.rating,
      title: review.title,
      content: review.content
    })
    setShowEditReviewModal(true)
  }

  const handleUpdateReview = async () => {
    if (!selectedReview) return

    setUpdatingReview(true)
    const { error } = await supabase
      .from('reviews')
      .update({
        rating: reviewEditForm.rating,
        title: reviewEditForm.title,
        content: reviewEditForm.content
      })
      .eq('id', selectedReview.id)

    if (error) {
      toast('Failed to update review: ' + error.message, 'error')
    } else {
      setShowEditReviewModal(false)
      setSelectedReview(null)
      if (selectedRoastery) {
        handleViewReviews(selectedRoastery)
      }
      fetchRoasteries()
    }
    setUpdatingReview(false)
  }

  const handleDeleteReview = async (reviewId: string) => {
    setSelectedReview(reviews.find(r => r.id === reviewId))
    setShowDeleteReviewModal(true)
  }

  const confirmDeleteReview = async () => {
    if (!selectedReview || !deletionReason.trim()) {
      toast('Please provide a deletion reason', 'warning')
      return
    }

    // First update the review with deletion_reason
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ deletion_reason: deletionReason })
      .eq('id', selectedReview.id)

    if (updateError) {
      toast('Failed to update review with deletion reason: ' + updateError.message, 'error')
      return
    }

    // Then delete the review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', selectedReview.id)

    if (error) {
      toast('Failed to delete review: ' + error.message, 'error')
    } else {
      // Log deletion and send notification
      const { error: logError } = await logDeletionWithNotification(
        {
          itemId: selectedReview.id,
          itemType: 'review',
          deletionReason: deletionReason,
          deletedBy: user?.id,
          originalTitle: selectedReview.title,
          originalContent: selectedReview.content,
          authorId: selectedReview.user_id
        },
        {
          userId: selectedReview.user_id,
          title: 'Your review has been deleted',
          message: `Your review "${selectedReview.title}" for ${selectedRoastery?.name || 'a roastery'} has been deleted. Reason: ${deletionReason}`,
          relatedItemId: selectedReview.id,
          relatedItemType: 'review',
          deletionReason: deletionReason
        }
      )

      if (logError) {
        // Failed to log deletion
      }

      setShowDeleteReviewModal(false)
      setSelectedReview(null)
      setDeletionReason("")
      if (selectedRoastery) {
        handleViewReviews(selectedRoastery)
      }
      fetchRoasteries()
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold mb-2">Manage Roasteries</h1>
              <p className="text-gray-600">View and manage all platform roasteries</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Roasteries ({filteredRoasteries.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search roasteries..."
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
                    <th className="text-left p-4 font-medium text-gray-600">Roastery</th>
                    <th className="text-left p-4 font-medium text-gray-600">Location</th>
                    <th className="text-left p-4 font-medium text-gray-600">Rating</th>
                    <th className="text-left p-4 font-medium text-gray-600">Reviews</th>
                    <th className="text-left p-4 font-medium text-gray-600">Added</th>
                    <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoasteries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No roasteries found</p>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your search query</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRoasteries.map((roastery) => (
                      <tr key={roastery.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Coffee className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <span className="font-medium block">{roastery.name}</span>
                              <span className="text-xs text-gray-500">{roastery.specialties.slice(0, 2).join(', ')}{roastery.specialties.length > 2 ? '...' : ''}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {roastery.location}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{roastery.rating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{roastery.reviewCount}</td>
                        <td className="p-4 text-gray-600">
                          {new Date(roastery.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(roastery)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/roasteries/${roastery.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReviews(roastery)}
                              title="View Reviews"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRoastery(roastery.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      {selectedRoastery && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reviews for {selectedRoastery.name}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedRoastery(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? (
              <p className="text-gray-500 text-center py-8">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reviews yet for this roastery.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      {review.user?.avatar_url ? (
                        <img
                          src={review.user.avatar_url}
                          alt={review.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Coffee className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.user?.name || 'Anonymous'}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {user?.role === 'admin' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditReviewModal(review)}
                              >
                                <Edit2 className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <p className="font-medium text-sm mb-1">{review.title}</p>
                        {review.content && (
                          <p className="text-gray-700 text-sm">{review.content}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Roastery Modal */}
      {showEditModal && selectedRoastery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Roastery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md min-h-24"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Specialties (comma-separated)</label>
                  <Input
                    value={editForm.specialties}
                    onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                    placeholder="e.g., Single Origin, Espresso, Cold Brew"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Website</label>
                  <Input
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Phone</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Address</label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateRoastery} disabled={updating}>
                    {updating ? 'Updating...' : 'Update Roastery'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Review Modal */}
      {showEditReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewEditForm({ ...reviewEditForm, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= reviewEditForm.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={reviewEditForm.title}
                    onChange={(e) => setReviewEditForm({ ...reviewEditForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <textarea
                    value={reviewEditForm.content}
                    onChange={(e) => setReviewEditForm({ ...reviewEditForm, content: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md min-h-24"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowEditReviewModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateReview} disabled={updatingReview}>
                    {updatingReview ? 'Updating...' : 'Update Review'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Review Modal */}
      {showDeleteReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this review? This action cannot be undone.
                </p>
                <div>
                  <label className="text-sm font-medium mb-2 block">Deletion Reason *</label>
                  <textarea
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md min-h-24"
                    placeholder="Please provide a reason for deleting this review..."
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDeleteReviewModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={confirmDeleteReview} className="bg-red-600 hover:bg-red-700">
                    Delete Review
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
