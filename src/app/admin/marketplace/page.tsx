"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, ShoppingBag, Plus, Edit2, Trash2, Eye, Star, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { MultiImageUpload } from "@/components/multi-image-upload"

interface Product {
  id: string
  name: string
  category: string
  price: number
  inStock: boolean
  averageRating: number
  reviewCount: number
  images: string[]
  externalLink?: string
  description?: string
  specifications?: Record<string, string>
}

export default function AdminMarketplacePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showEditReviewModal, setShowEditReviewModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [reviewEditForm, setReviewEditForm] = useState({
    rating: 5,
    comment: ""
  })
  const [updatingReview, setUpdatingReview] = useState(false)
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false)
  const [deletionReason, setDeletionReason] = useState("")

  const categories = ["all", "beans", "equipment", "accessories"]

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "beans",
    price: "",
    description: "",
    inStock: true,
    images: [] as string[],
    specifications: {} as Record<string, string>,
    externalLink: "",
    averageRating: "0",
    reviewCount: "0",
  })

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      router.push('/')
      return
    }
    fetchProducts()
  }, [user, router])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('coffee_products')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setProducts(data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        inStock: p.in_stock,
        averageRating: p.average_rating || 0,
        reviewCount: p.review_count || 0,
        images: p.images || [],
        externalLink: p.external_link,
        description: p.description,
        specifications: p.specifications,
      })))
    }
    setLoading(false)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('coffee_products')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Failed to delete product: ' + error.message)
    } else {
      fetchProducts()
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      description: product.description || "",
      inStock: product.inStock,
      images: product.images,
      specifications: product.specifications || {},
      externalLink: product.externalLink || "",
      averageRating: product.averageRating.toString(),
      reviewCount: product.reviewCount.toString(),
    })
    setShowAddModal(true)
  }

  const handleViewReviews = async (product: Product) => {
    setSelectedProduct(product)
    setReviewsLoading(true)
    const { data: reviewsData, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    } else if (reviewsData) {
      const userIds = [...new Set(reviewsData.map((r: any) => r.user_id))]
      let profilesMap = new Map()

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds)

        profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || [])
      }

      setReviews(reviewsData.map((r: any) => ({
        ...r,
        user: profilesMap.get(r.user_id)
      })))
    } else {
      setReviews([])
    }
    setReviewsLoading(false)
  }

  const openEditReviewModal = (review: any) => {
    setSelectedReview(review)
    setReviewEditForm({
      rating: review.rating,
      comment: review.comment
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
      alert('Failed to update review: ' + error.message)
    } else {
      setShowEditReviewModal(false)
      setSelectedReview(null)
      if (selectedProduct) {
        handleViewReviews(selectedProduct)
      }
    }
    setUpdatingReview(false)
  }

  const handleDeleteReview = async (reviewId: string) => {
    setSelectedReview(reviews.find(r => r.id === reviewId))
    setShowDeleteReviewModal(true)
  }

  const confirmDeleteReview = async () => {
    if (!selectedReview || !deletionReason.trim()) {
      alert('Please provide a deletion reason')
      return
    }

    // Fetch review details before deletion
    const { data: reviewData } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('id', selectedReview.id)
      .single()

    if (!reviewData) {
      alert('Failed to fetch review details')
      return
    }

    // Log to deletion_log
    const { error: logError } = await supabase
      .from('deletion_log')
      .insert({
        item_id: selectedReview.id,
        item_type: 'review',
        deletion_reason: deletionReason,
        deleted_by: user.id,
        original_title: `Product Review - Rating: ${reviewData.rating}`,
        original_content: reviewData.comment,
        author_id: reviewData.user_id
      })

    if (logError) {
      console.error('Error logging deletion:', logError)
    }

    // Send notification to user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: reviewData.user_id,
        type: 'deletion',
        title: 'Your product review was deleted',
        message: `Your review for the product has been deleted by an administrator. Reason: ${deletionReason}`,
        related_item_type: 'review',
        related_item_id: selectedReview.id,
        deletion_reason: deletionReason
      })

    if (notificationError) {
      console.error('Error sending notification:', notificationError.message || notificationError)
      // Continue with deletion even if notification fails
    }

    // Delete the review
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', selectedReview.id)

    if (error) {
      alert('Failed to delete review: ' + error.message)
    } else {
      setShowDeleteReviewModal(false)
      setSelectedReview(null)
      setDeletionReason("")
      if (selectedProduct) {
        handleViewReviews(selectedProduct)
      }
      fetchProducts() // Refresh to update product rating
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError("")

    console.log('Submitting product data:', formData)
    console.log('Images being saved:', formData.images)

    try {
      if (editingProduct) {
        // Update existing product
        console.log('Updating product with ID:', editingProduct.id)
        const { error } = await supabase
          .from('coffee_products')
          .update({
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price),
            description: formData.description,
            in_stock: formData.inStock,
            images: formData.images,
            specifications: formData.specifications,
            external_link: formData.externalLink || null,
            average_rating: parseFloat(formData.averageRating),
            review_count: parseInt(formData.reviewCount),
          })
          .eq('id', editingProduct.id)

        if (error) {
          console.error('Update error:', error)
          throw error
        }
        console.log('Product updated successfully')
      } else {
        // Add new product
        const { error } = await supabase
          .from('coffee_products')
          .insert({
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price),
            description: formData.description,
            in_stock: formData.inStock,
            images: formData.images,
            specifications: formData.specifications,
            external_link: formData.externalLink || null,
          })

        if (error) throw error
      }

      setShowAddModal(false)
      setEditingProduct(null)
      setFormData({
        name: "",
        category: "beans",
        price: "",
        description: "",
        inStock: true,
        images: [],
        specifications: {},
        externalLink: "",
        averageRating: "0",
        reviewCount: "0",
      })
      fetchProducts()
    } catch (error: any) {
      console.error('Submit error:', error)
      setSubmitError(error.message || "Failed to save product")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowAddModal(false)
    setEditingProduct(null)
    setFormData({
      name: "",
      category: "beans",
      price: "",
      description: "",
      inStock: true,
      images: [],
      specifications: {},
      externalLink: "",
      averageRating: "0",
      reviewCount: "0",
    })
    setSubmitError("")
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
              <h1 className="text-4xl font-bold mb-2">Manage Marketplace</h1>
              <p className="text-gray-600">View and manage all marketplace products</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Products ({filteredProducts.length})</CardTitle>
              <div className="flex gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                  className={selectedCategory === category ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-gray-600">Product</th>
                    <th className="text-left p-4 font-medium text-gray-600">Category</th>
                    <th className="text-left p-4 font-medium text-gray-600">Price</th>
                    <th className="text-left p-4 font-medium text-gray-600">Stock</th>
                    <th className="text-left p-4 font-medium text-gray-600">Rating</th>
                    <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 capitalize">{product.category}</td>
                      <td className="p-4 text-gray-600">${product.price.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {product.averageRating > 0 ? (
                          <div className="flex items-center">
                            <span className="mr-1">{product.averageRating.toFixed(1)}</span>
                            <span className="text-gray-400">({product.reviewCount})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No ratings</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReviews(product)}
                            title="View Reviews"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/marketplace/${product.id}`)}
                            title="View Product"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            title="Edit Product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            title="Delete Product"
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

        {/* Reviews Section */}
        {selectedProduct && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reviews for {selectedProduct.name}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedProduct(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <p className="text-gray-500 text-center py-8">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet for this product.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        {review.user?.avatar_url ? (
                          <img
                            src={review.user.avatar_url}
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
                          {review.comment && (
                            <p className="text-gray-700 text-sm">{review.comment}</p>
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
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    {categories.filter(c => c !== 'all').map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Images</label>
                  <MultiImageUpload
                    images={formData.images}
                    onImagesChange={(images) => setFormData({ ...formData, images })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Specifications (JSON)</label>
                  <textarea
                    value={JSON.stringify(formData.specifications, null, 2)}
                    onChange={(e) => {
                      try {
                        setFormData({ ...formData, specifications: JSON.parse(e.target.value) })
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md min-h-[80px] font-mono text-sm"
                    placeholder='{"key": "value"}'
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="inStock" className="text-sm">In Stock</label>
                </div>
                {editingProduct && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Average Rating (0-5)</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.averageRating}
                        onChange={(e) => setFormData({ ...formData, averageRating: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Review Count</label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.reviewCount}
                        onChange={(e) => setFormData({ ...formData, reviewCount: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium mb-2 block">External Link (Shopee)</label>
                  <Input
                    value={formData.externalLink}
                    onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                    placeholder="https://shopee.com/..."
                  />
                </div>
                {submitError && (
                  <p className="text-sm text-red-600">{submitError}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
                    {submitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                  </Button>
                </div>
              </form>
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
