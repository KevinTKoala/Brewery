"use client"

import { useState, useEffect } from "react"
import { Search, ShoppingBag, Filter, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CoffeeProduct, DatabaseCoffeeProduct } from "@/types"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function MarketplacePage() {
  const [products, setProducts] = useState<CoffeeProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const categories = ["all", "beans", "equipment", "accessories"]

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('coffee_products')
      .select('*')
      .order('average_rating', { ascending: false })

    if (data) {
      setProducts(data.map((p: DatabaseCoffeeProduct) => ({
        id: p.id,
        name: p.name,
        category: p.category as 'beans' | 'equipment' | 'accessories',
        roasteryId: p.roastery_id,
        price: p.price,
        description: p.description,
        images: p.images || [],
        inStock: p.in_stock,
        averageRating: p.average_rating || 0,
        reviewCount: p.review_count || 0,
        specifications: p.specifications,
        externalLink: p.external_link,
      })))
    }
    setLoading(false)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Coffee Marketplace</h1>
              <p className="text-gray-600">Discover coffee beans, equipment, and accessories</p>
            </div>
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {showFilters && (
            <div className="flex gap-2 mb-6">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p>Loading...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/marketplace/${product.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                      {!product.inStock && (
                        <div className="absolute top-2 right-2 bg-gray-900 text-white px-2 py-1 text-xs rounded">
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-green-600 font-medium uppercase">
                          {product.category}
                        </span>
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                          <span>{product.averageRating.toFixed(1)}</span>
                          <span className="text-gray-400 ml-1">({product.reviewCount})</span>
                        </div>
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
