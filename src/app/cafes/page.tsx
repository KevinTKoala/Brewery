"use client"

import { useState, useEffect } from "react"
import { Search, Star, MapPin, Clock, ChevronDown, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Cafe } from "@/types"
import Image from "next/image"

export default function CafesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [minRating, setMinRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<"newest" | "highest_rated" | "most_reviews">("newest")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCafes()
  }, [])

  const fetchCafes = async () => {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setCafes(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        description: c.description,
        rating: c.rating,
        reviewCount: c.review_count,
        specialties: c.specialties,
        website: c.website,
        phone: c.phone,
        address: c.address,
        hours: c.hours,
        images: c.images,
        image: c.image,
      })))
    }
    setLoading(false)
  }

  const allSpecialties = Array.from(
    new Set(cafes.flatMap((c) => c.specialties))
  ).sort()

  const filteredCafes = cafes
    .filter((cafe) => {
      const matchesSearch =
        cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cafe.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cafe.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSpecialty =
        !selectedSpecialty || cafe.specialties.includes(selectedSpecialty)

      const matchesRating = !minRating || cafe.rating >= minRating

      return matchesSearch && matchesSpecialty && matchesRating
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "highest_rated":
          return b.rating - a.rating
        case "most_reviews":
          return b.reviewCount - a.reviewCount
        case "newest":
        default:
          return 0 // Keep original order (newest from database)
      }
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4">Coffee Cafes</h1>
          <p className="text-gray-600 mb-6">
            Find the best cafes near you with reviews from coffee enthusiasts
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search cafes by name, location, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showAdvancedFilters ? "default" : "outline"}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
              </Button>
              <Link href="/cafes/add">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Add Cafe
                </Button>
              </Link>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-4">
              <div>
                <h3 className="font-medium mb-2 text-sm">Specialty</h3>
                <div className="flex gap-2 flex-wrap items-center">
                  <Button
                    variant={!selectedSpecialty ? "default" : "outline"}
                    onClick={() => setSelectedSpecialty(null)}
                    size="sm"
                  >
                    All
                  </Button>
                  {allSpecialties.map((specialty) => (
                    <Button
                      key={specialty}
                      variant={selectedSpecialty === specialty ? "default" : "outline"}
                      onClick={() => setSelectedSpecialty(specialty)}
                      size="sm"
                    >
                      {specialty}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2 text-sm">Minimum Rating</h3>
                <div className="flex gap-2 flex-wrap items-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={minRating === rating ? "default" : "outline"}
                      onClick={() => setMinRating(minRating === rating ? null : rating)}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Star className="h-4 w-4" />
                      {rating}+
                    </Button>
                  ))}
                  {minRating && (
                    <Button
                      variant="ghost"
                      onClick={() => setMinRating(null)}
                      size="sm"
                      className="text-gray-500"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2 text-sm">Sort By</h3>
                <div className="flex gap-2 flex-wrap items-center">
                  <Button
                    variant={sortBy === "newest" ? "default" : "outline"}
                    onClick={() => setSortBy("newest")}
                    size="sm"
                  >
                    Newest
                  </Button>
                  <Button
                    variant={sortBy === "highest_rated" ? "default" : "outline"}
                    onClick={() => setSortBy("highest_rated")}
                    size="sm"
                  >
                    Highest Rated
                  </Button>
                  <Button
                    variant={sortBy === "most_reviews" ? "default" : "outline"}
                    onClick={() => setSortBy("most_reviews")}
                    size="sm"
                  >
                    Most Reviews
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading cafes...</p>
          </div>
        ) : filteredCafes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No cafes found matching your search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCafes.map((cafe) => (
              <Link key={cafe.id} href={`/cafes/${cafe.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  {cafe.image && (
                    <div className="relative h-48 w-full">
                      <img
                        src={cafe.image}
                        alt={cafe.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{cafe.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {cafe.location}
                        </CardDescription>
                      </div>
                      <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                        <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                        <span className="ml-1 text-sm font-medium">{cafe.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {cafe.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cafe.specialties.slice(0, 3).map((specialty) => (
                        <span
                          key={specialty}
                          className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    {cafe.hours && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="truncate">{cafe.hours}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{cafe.reviewCount} reviews</span>
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
