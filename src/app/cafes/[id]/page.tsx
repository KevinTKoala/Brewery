"use client"

import { useState, useEffect, use } from "react"
import { notFound } from "next/navigation"
import { useRouter } from "next/navigation"
import { Star, MapPin, Phone, Clock, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Cafe, Review } from "@/types"
import { ImageUpload } from "@/components/image-upload"
import { containsBannedWords, getBannedWords } from "@/lib/word-filter"

export default function CafeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const { user, loading } = useAuth()
  const router = useRouter()
  const [cafe, setCafe] = useState<Cafe | null>(null)
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

  const fetchCafe = async () => {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('id', unwrappedParams.id)
      .single()

    if (data) {
      setCafe({
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
        hours: data.hours,
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
      .eq('target_type', 'cafe')
      .order('created_at', { ascending: false })

    if (data) {
      setReviews(data.map((r: any) => ({
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
    fetchCafe()
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
        target_type: 'cafe',
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
      fetchCafe() // To update review count
    }

    setSubmitting(false)
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!cafe) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{cafe.name}</h1>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span className="text-lg">{cafe.location}</span>
                </div>
              </div>
              <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-full">
                <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
                <span className="ml-2 text-2xl font-bold">{cafe.rating}</span>
                <span className="ml-2 text-gray-600">({cafe.reviewCount})</span>
              </div>
            </div>

            {cafe.image && (
              <div className="mb-6">
                <img
                  src={cafe.image}
                  alt={cafe.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {cafe.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {specialty}
                </span>
              ))}
            </div>

            <p className="text-gray-700 text-lg mb-6">{cafe.description}</p>

            <div className="flex flex-wrap gap-4">
              {cafe.hours && (
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{cafe.hours}</span>
                </div>
              )}
              {cafe.phone && (
                <a
                  href={`tel:${cafe.phone}`}
                  className="flex items-center text-gray-600 hover:text-gray-700"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  {cafe.phone}
                </a>
              )}
            </div>

            {cafe.address && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="text-gray-700">{cafe.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>
            <Button onClick={() => setShowReviewForm(!showReviewForm)} className="bg-amber-600 hover:bg-amber-700">
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
                      placeholder="Share your experience with this cafe"
                      required
                      minLength={10}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
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
        </div>
      </div>
    </div>
  )
}
