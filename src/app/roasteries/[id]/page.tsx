"use client"

import { useState, useEffect, use } from "react"
import { notFound } from "next/navigation"
import { useRouter } from "next/navigation"
import { Star, MapPin, Phone, Globe, ExternalLink, ThumbsUp, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Roastery, Review, DatabaseRoastery, DatabaseReview } from "@/types"
import { ImageUpload } from "@/components/image-upload"
import { containsBannedWords, getBannedWords } from "@/lib/word-filter"
import { useToast } from "@/lib/toast-context"

export default function RoasteryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [roastery, setRoastery] = useState<Roastery | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

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

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewTitle, setReviewTitle] = useState("")
  const [reviewContent, setReviewContent] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewImageUrl, setReviewImageUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [showEditReviewModal, setShowEditReviewModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [reviewEditForm, setReviewEditForm] = useState({
    rating: 5,
    title: "",
    content: ""
  })
  const [updatingReview, setUpdatingReview] = useState(false)
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false)
  const [deletionReason, setDeletionReason] = useState("")

  const fetchRoastery = async () => {
    const { data, error } = await supabase
      .from('roasteries')
      .select('*')
      .eq('id', unwrappedParams.id)
      .single()

    if (data) {
      setRoastery({
        id: data.id,
        name: data.name,
        location: data.location,
        description: data.description,
        rating: data.rating,
        reviewCount: data.review_count,
        specialties: data.specialties,
        website: data.website,
        phone: data.phone,
        address: data.address,
        images: data.images,
        image: data.image,
      })
    }
    setDataLoading(false)
  }

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('target_id', unwrappedParams.id)
      .eq('target_type', 'roastery')
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
        userName: r.user_id, // Will be updated with profile name
        helpfulCount: r.helpful_count,
        createdAt: r.created_at,
        image: r.image,
      })))
    }
  }

  useEffect(() => {
    fetchRoastery()
    fetchReviews()
  }, [unwrappedParams.id])

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setSubmitError("Please log in to submit a review")
      return
    }

    // Check for banned words in review title and content
    const titleBannedWords = getBannedWords(reviewTitle)
    const contentBannedWords = getBannedWords(reviewContent)

    if (titleBannedWords.length > 0 || contentBannedWords.length > 0) {
      const allBannedWords = [...new Set([...titleBannedWords, ...contentBannedWords])]
      setSubmitError(`Your review contains inappropriate language: ${allBannedWords.join(', ')}. Please remove these words and try again.`)
      return
    }

    setSubmitting(true)
    setSubmitError("")

    const { error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        target_id: unwrappedParams.id,
        target_type: 'roastery',
        rating: reviewRating,
        title: reviewTitle,
        content: reviewContent,
        image: reviewImageUrl,
      })

    if (error) {
      setSubmitError(error.message)
    } else {
      setShowReviewForm(false)
      setReviewTitle("")
      setReviewContent("")
      setReviewRating(5)
      setReviewImageUrl(null)
      fetchReviews()
      fetchRoastery() // To update review count
    }

    setSubmitting(false)
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
      fetchReviews()
      fetchRoastery()
    }
    setUpdatingReview(false)
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
      // Log to deletion_log
      const { error: logError } = await supabase
        .from('deletion_log')
        .insert({
          item_type: 'review',
          item_id: selectedReview.id,
          deletion_reason: deletionReason,
          deleted_by: user?.id,
          original_title: selectedReview.title,
          original_content: selectedReview.content,
          author_id: selectedReview.userId
        })

      if (logError) {
        console.error('Failed to log deletion:', logError.message || logError)
      }

      // Send notification to user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedReview.userId,
          type: 'deletion',
          title: 'Your review has been deleted',
          message: `Your review "${selectedReview.title}" for ${roastery?.name || 'a roastery'} has been deleted. Reason: ${deletionReason}`,
          related_item_id: selectedReview.id,
          related_item_type: 'review',
          deletion_reason: deletionReason
        })

      if (notificationError) {
        console.error('Failed to send notification:', notificationError.message || notificationError)
      }

      setShowDeleteReviewModal(false)
      setSelectedReview(null)
      setDeletionReason("")
      fetchReviews()
      fetchRoastery()
    }
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!roastery) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{roastery.name}</h1>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span className="text-lg">{roastery.location}</span>
                </div>
              </div>
              <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-full">
                <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
                <span className="ml-2 text-2xl font-bold">{roastery.rating}</span>
                <span className="ml-2 text-gray-600">({roastery.reviewCount})</span>
              </div>
            </div>

            {roastery.image && (
              <div className="mb-6">
                <img
                  src={roastery.image}
                  alt={roastery.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {roastery.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {specialty}
                </span>
              ))}
            </div>

            <p className="text-gray-700 text-lg mb-6">{roastery.description}</p>

            <div className="flex flex-wrap gap-4">
              {roastery.website && (
                <a
                  href={roastery.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-600 hover:text-green-700"
                >
                  <Globe className="h-5 w-5 mr-2" />
                  Visit Website
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              )}
              {roastery.phone && (
                <a
                  href={`tel:${roastery.phone}`}
                  className="flex items-center text-gray-600 hover:text-gray-700"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  {roastery.phone}
                </a>
              )}
            </div>

            {roastery.address && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="text-gray-700">{roastery.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>
            <Button onClick={() => setShowReviewForm(!showReviewForm)} className="bg-green-600 hover:bg-green-700">
              {showReviewForm ? "Cancel" : "Write a Review"}
            </Button>
          </div>

          {showReviewForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setReviewRating(rating)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              rating <= reviewRating
                                ? "text-yellow-600 fill-yellow-600"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="title" className="text-sm font-medium mb-2 block">
                      Title
                    </label>
                    <Input
                      id="title"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Summarize your experience"
                      required
                      minLength={2}
                    />
                  </div>
                  <div>
                    <label htmlFor="content" className="text-sm font-medium mb-2 block">
                      Review
                    </label>
                    <textarea
                      id="content"
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Share your experience with this roastery"
                      required
                      minLength={10}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Image (optional)
                    </label>
                    <ImageUpload
                      onUploadComplete={(url) => setReviewImageUrl(url)}
                      onUploadError={(error) => setSubmitError(error)}
                    />
                  </div>
                  {submitError && (
                    <p className="text-sm text-red-600">{submitError}</p>
                  )}
                  <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {reviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No reviews yet. Be the first to review!</p>
              </CardContent>
            </Card>
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
                        <div className="flex items-center">
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
                        {(user?.role === 'admin' || user?.role === 'moderator') && (
                          <div className="flex gap-1">
                            {user?.role === 'admin' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedReview(review)
                                  setReviewEditForm({
                                    rating: review.rating,
                                    title: review.title,
                                    content: review.content
                                  })
                                  setShowEditReviewModal(true)
                                }}
                              >
                                <Edit2 className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReview(review)
                                setShowDeleteReviewModal(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {review.image && (
                      <img
                        src={review.image}
                        alt="Review image"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <p className="text-gray-700 mb-4">{review.content}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {review.helpfulCount} Helpful
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                                  ? 'text-yellow-600 fill-yellow-600'
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
      </div>
    </div>
  )
}
