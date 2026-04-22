"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Store, Trash2, Eye, MapPin, Star, Edit2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { MultiImageUpload } from "@/components/multi-image-upload"
import { DatabaseCafe, DatabaseReview } from "@/types"
import { useToast } from "@/lib/toast-context"
import { logDeletionWithNotification } from "@/lib/deletion-utils"

interface Cafe {
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
  hours?: string
  images: string[]
  created_at: string
}

interface Review {
  id: string
  userId: string
  targetId: string
  targetType: string
  rating: number
  title: string
  content: string
  userName: string
  helpfulCount: number
  createdAt: string
}

export default function AdminCafesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReviewsModal, setShowReviewsModal] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showEditReviewModal, setShowEditReviewModal] = useState(false)
  const [reviewEditForm, setReviewEditForm] = useState({
    rating: 5,
    title: "",
    content: ""
  })
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false)
  const [selectedReviewToDelete, setSelectedReviewToDelete] = useState<string | null>(null)
  const [deletionReason, setDeletionReason] = useState("")
  const [updating, setUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    description: "",
    specialties: "",
    website: "",
    phone: "",
    address: "",
    hours: "",
    images: [] as string[],
    rating: 0,
    reviewCount: 0,
    googleMapsLink: "",
  })

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      router.push('/')
      return
    }
    fetchCafes()
  }, [user, router])

  const fetchCafes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setCafes(data.map((c: DatabaseCafe) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        description: c.description,
        rating: c.rating,
        reviewCount: c.review_count,
        specialties: c.specialties || [],
        website: c.website,
        phone: c.phone,
        address: c.address,
        hours: c.hours,
        images: c.images || [],
        created_at: c.created_at,
      })))
    }
    setLoading(false)
  }

  const filteredCafes = cafes.filter(cafe =>
    cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cafe.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteCafe = async (cafeId: string) => {
    if (!confirm('Are you sure you want to delete this cafe? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('cafes')
      .delete()
      .eq('id', cafeId)

    if (error) {
      toast('Failed to delete cafe: ' + error.message, 'error')
    } else {
      fetchCafes()
    }
  }

  const handleUpdateCafe = async () => {
    if (!selectedCafe) return

    setUpdating(true)
    const specialtiesArray = editForm.specialties.split(',').map(s => s.trim()).filter(s => s)

    const { error } = await supabase
      .from('cafes')
      .update({
        name: editForm.name,
        location: editForm.location,
        description: editForm.description,
        specialties: specialtiesArray,
        website: editForm.website || null,
        phone: editForm.phone || null,
        address: editForm.address || null,
        hours: editForm.hours || null,
        images: editForm.images,
        rating: editForm.rating,
        review_count: editForm.reviewCount,
        google_maps_link: editForm.googleMapsLink || null,
      })
      .eq('id', selectedCafe.id)

    if (error) {
      toast('Failed to update cafe: ' + error.message, 'error')
    } else {
      setShowEditModal(false)
      setSelectedCafe(null)
      fetchCafes()
    }
    setUpdating(false)
  }

  const openEditModal = (cafe: Cafe) => {
    setSelectedCafe(cafe)
    setEditForm({
      name: cafe.name,
      location: cafe.location,
      description: cafe.description,
      specialties: cafe.specialties.join(', '),
      website: cafe.website || '',
      phone: cafe.phone || '',
      address: cafe.address || '',
      hours: cafe.hours || '',
      images: cafe.images || [],
      rating: cafe.rating,
      reviewCount: cafe.reviewCount,
      googleMapsLink: (cafe as any).google_maps_link || '',
    })
    setShowEditModal(true)
  }

  const fetchReviews = async (cafeId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('target_id', cafeId)
      .eq('target_type', 'cafe')
      .order('created_at', { ascending: false })

    if (data) {
      setReviews(data.map((r: DatabaseReview) => ({
        id: r.id,
        userId: r.user_id,
        targetId: r.target_id,
        targetType: r.target_type,
        rating: r.rating,
        title: r.title,
        content: r.content,
        userName: r.user_id,
        helpfulCount: r.helpful_count,
        createdAt: r.created_at,
      })))
    }
  }

  const openReviewsModal = async (cafe: Cafe) => {
    setSelectedCafe(cafe)
    await fetchReviews(cafe.id)
    setShowReviewsModal(true)
  }

  const openEditReviewModal = (review: Review) => {
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

    setUpdating(true)
    const { error } = await supabase
      .from('reviews')
      .update({
        rating: reviewEditForm.rating,
        title: reviewEditForm.title,
        content: reviewEditForm.content,
      })
      .eq('id', selectedReview.id)

    if (error) {
      toast('Failed to update review: ' + error.message, 'error')
    } else {
      setShowEditReviewModal(false)
      setSelectedReview(null)
      if (selectedCafe) {
        await fetchReviews(selectedCafe.id)
        fetchCafes() // Refresh to update cafe rating
      }
    }
    setUpdating(false)
  }

  const handleDeleteReview = async (reviewId: string) => {
    setSelectedReviewToDelete(reviewId)
    setDeletionReason("")
    setShowDeleteReviewModal(true)
  }

  const confirmDeleteReview = async () => {
    if (!selectedReviewToDelete || !deletionReason.trim()) {
      toast('Please provide a deletion reason', 'warning')
      return
    }

    // Get review details before deletion
    const { data: reviewData, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', selectedReviewToDelete)
      .single()

    if (fetchError) {
      toast('Failed to fetch review details: ' + fetchError.message, 'error')
      return
    }

    // Log deletion and send notification
    const { error: logError } = await logDeletionWithNotification(
      {
        itemId: selectedReviewToDelete,
        itemType: 'review',
        deletionReason: deletionReason.trim(),
        deletedBy: user?.id,
        originalTitle: reviewData.title,
        originalContent: reviewData.content,
        authorId: reviewData.user_id
      },
      {
        userId: reviewData.user_id,
        title: 'Your review was deleted',
        message: `Your review "${reviewData.title}" has been deleted. Reason: ${deletionReason.trim()}`,
        relatedItemType: 'review',
        relatedItemId: selectedReviewToDelete,
        deletionReason: deletionReason.trim()
      }
    )

    if (logError) {
      toast('Failed to log deletion: ' + logError, 'error')
      return
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', selectedReviewToDelete)

    if (error) {
      toast('Failed to delete review: ' + error.message, 'error')
    } else {
      setShowDeleteReviewModal(false)
      setSelectedReviewToDelete(null)
      setDeletionReason("")
      if (selectedCafe) {
        await fetchReviews(selectedCafe.id)
        fetchCafes() // Refresh to update cafe rating
      }
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
              <h1 className="text-4xl font-bold mb-2">Manage Cafes</h1>
              <p className="text-gray-600">View and manage all platform cafes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Cafes ({filteredCafes.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cafes..."
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
                    <th className="text-left p-4 font-medium text-gray-600">Cafe</th>
                    <th className="text-left p-4 font-medium text-gray-600">Location</th>
                    <th className="text-left p-4 font-medium text-gray-600">Rating</th>
                    <th className="text-left p-4 font-medium text-gray-600">Reviews</th>
                    <th className="text-left p-4 font-medium text-gray-600">Added</th>
                    <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCafes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No cafes found</p>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your search query</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCafes.map((cafe) => (
                      <tr key={cafe.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                              <Store className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <span className="font-medium block">{cafe.name}</span>
                              <span className="text-xs text-gray-500">{cafe.specialties.slice(0, 2).join(', ')}{cafe.specialties.length > 2 ? '...' : ''}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {cafe.location}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{cafe.rating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{cafe.reviewCount}</td>
                        <td className="p-4 text-gray-600">
                          {new Date(cafe.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewsModal(cafe)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(cafe)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/cafes/${cafe.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCafe(cafe.id)}
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

      {/* Edit Cafe Modal */}
      {showEditModal && selectedCafe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Cafe</CardTitle>
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
                    placeholder="e.g., Single Origin, Pour-over, Espresso"
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
                <div>
                  <label className="text-sm font-medium mb-2 block">Hours</label>
                  <Input
                    value={editForm.hours}
                    onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })}
                    placeholder="e.g., Mon-Fri 8am-6pm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Google Maps Link</label>
                  <Input
                    value={editForm.googleMapsLink}
                    onChange={(e) => setEditForm({ ...editForm, googleMapsLink: e.target.value })}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Images</label>
                  <MultiImageUpload
                    images={editForm.images}
                    onImagesChange={(images) => setEditForm({ ...editForm, images })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rating (Google Maps)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={editForm.rating}
                      onChange={(e) => setEditForm({ ...editForm, rating: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 4.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Review Count (Google Maps)</label>
                    <Input
                      type="number"
                      min="0"
                      value={editForm.reviewCount}
                      onChange={(e) => setEditForm({ ...editForm, reviewCount: parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 150"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateCafe} disabled={updating}>
                    {updating ? 'Updating...' : 'Update Cafe'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && selectedCafe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reviews for {selectedCafe.name}</CardTitle>
                <Button variant="outline" onClick={() => setShowReviewsModal(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{review.title}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">by {review.userName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < review.rating
                                      ? "text-yellow-600 fill-yellow-600"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            {user?.role === 'admin' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditReviewModal(review)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-2">{review.content}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Review Modal */}
      {showEditReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewEditForm({ ...reviewEditForm, rating })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            rating <= reviewEditForm.rating
                              ? "text-yellow-600 fill-yellow-600"
                              : "text-gray-300"
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
                  <Button onClick={handleUpdateReview} disabled={updating}>
                    {updating ? 'Updating...' : 'Update Review'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Review Modal */}
      {showDeleteReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Deletion Reason *</label>
                  <textarea
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    placeholder="Please provide a reason for deleting this review..."
                    className="w-full px-3 py-2 border rounded-md min-h-24"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDeleteReviewModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={confirmDeleteReview}>
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
