"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ShoppingBag, Star, MessageSquare, Heart, Share2, ExternalLink, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CoffeeProduct, ProductReview, DatabaseCoffeeProduct, DatabaseProductReview } from "@/types"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/lib/toast-context"
import Link from "next/link"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [product, setProduct] = useState<CoffeeProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ""
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showEditReviewModal, setShowEditReviewModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null)
  const [reviewEditForm, setReviewEditForm] = useState({
    rating: 5,
    comment: ""
  })
  const [updatingReview, setUpdatingReview] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('coffee_products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (data) {
      setProduct({
        id: data.id,
        name: data.name,
        category: data.category,
        roasteryId: data.roastery_id,
        price: data.price,
        description: data.description,
        images: data.images || [],
        inStock: data.in_stock,
        averageRating: data.average_rating || 0,
        reviewCount: data.review_count || 0,
        specifications: data.specifications,
        externalLink: data.external_link,
      })
      fetchReviews()
    }
    setLoading(false)
  }

  const fetchReviews = async () => {
    setReviewLoading(true)
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', params.id)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
      setReviewLoading(false)
      return
    }

    if (reviewsData && reviewsData.length > 0) {
      // Fetch user profiles for all reviewers
      const userIds = [...new Set(reviewsData.map((r: DatabaseProductReview) => r.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds)

      const profilesMap = new Map(profilesData?.map((p: { id: string; username?: string; avatar_url?: string }) => [p.id, p]) || [])

      setReviews(reviewsData.map((r: DatabaseProductReview) => ({
        id: r.id,
        productId: r.product_id,
        userId: r.user_id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        user: {
          username: profilesMap.get(r.user_id)?.username,
          avatarUrl: profilesMap.get(r.user_id)?.avatar_url
        }
      })))
    } else {
      setReviews([])
    }
    setReviewLoading(false)
  }

  const handleLike = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setLiked(!liked)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      })
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push("/login")
      return
    }

    setSubmittingReview(true)

    try {
      const { error } = await supabase
        .from('product_reviews')
        .upsert({
          product_id: params.id,
          user_id: user.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }, {
          onConflict: 'product_id,user_id'
        })

      if (error) throw error

      setReviewForm({ rating: 5, comment: "" })
      fetchReviews()
      fetchProduct() // Refresh product to get updated rating
    } catch (error: unknown) {
      console.error('Review submission error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to submit review"
      toast(errorMessage, 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  const openEditReviewModal = (review: ProductReview) => {
    setSelectedReview(review)
    setReviewEditForm({
      rating: review.rating,
      comment: review.comment || ""
    })
    setShowEditReviewModal(true)
  }

  const handleUpdateReview = async () => {
    if (!selectedReview) return

    setUpdatingReview(true)
    const { error } = await supabase
      .from('product_reviews')
      .update({
        rating: reviewEditForm.rating,
        comment: reviewEditForm.comment
      })
      .eq('id', selectedReview.id)

    if (error) {
      toast('Failed to update review: ' + error.message, 'error')
    } else {
      setShowEditReviewModal(false)
      setSelectedReview(null)
      fetchReviews()
      fetchProduct() // Refresh product to get updated rating
    }
    setUpdatingReview(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Product not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Images */}
              <div>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[selectedImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-24 w-24 text-gray-300" />
                    </div>
                  )}
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-colors ${
                          selectedImageIndex === index ? 'border-green-600' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-green-600 font-medium uppercase bg-green-50 px-2 py-1 rounded">
                    {product.category}
                  </span>
                  {!product.inStock && (
                    <span className="text-sm text-red-600 font-medium uppercase bg-red-50 px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
                    <span className="font-semibold">{product.averageRating.toFixed(1)}</span>
                    <span className="text-gray-500 ml-1">({product.reviewCount} reviews)</span>
                  </div>
                </div>

                <div className="text-3xl font-bold text-green-600 mb-6">
                  ${product.price.toFixed(2)}
                </div>

                <p className="text-gray-700 mb-6">{product.description}</p>

                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Specifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <dt className="text-gray-600 capitalize">{key}</dt>
                            <dd className="font-medium">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3 mb-6">
                  {product.externalLink ? (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!product.inStock}
                      size="lg"
                      onClick={() => window.open(product.externalLink, '_blank')}
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      {product.inStock ? "Buy on Shopee" : "Out of Stock"}
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!product.inStock}
                      size="lg"
                    >
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  )}
                  <Button variant="outline" size="lg" onClick={handleLike}>
                    <Heart className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>

                {product.roasteryId && (
                  <Card>
                    <CardContent className="p-4">
                      <Link href={`/roasteries/${product.roasteryId}`} className="text-sm text-gray-600 hover:text-green-600">
                        View Roaster →
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Review Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Write a Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= reviewForm.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    placeholder="Share your experience with this product..."
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reviews ({product.reviewCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviewLoading ? (
                <p className="text-gray-500 text-center py-8">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this product!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        {review.user?.avatarUrl ? (
                          <img
                            src={review.user.avatarUrl}
                            alt={review.user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{review.user?.username || 'Anonymous'}</span>
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
                            {(user?.role === 'admin' || user?.role === 'moderator') && (
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
                                  onClick={() => toast('Delete functionality coming soon', 'info')}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 text-sm">{review.comment}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                      <label className="text-sm font-medium mb-2 block">Comment</label>
                      <textarea
                        value={reviewEditForm.comment}
                        onChange={(e) => setReviewEditForm({ ...reviewEditForm, comment: e.target.value })}
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
        </div>
      </div>
    </div>
  )
}
