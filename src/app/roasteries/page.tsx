"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Star, MapPin, ChevronDown, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Roastery } from "@/types"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

export default function RoasteriesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [minRating, setMinRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<"newest" | "highest_rated" | "most_reviews">("newest")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [roasteries, setRoasteries] = useState<Roastery[]>([])
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

  const fetchRoasteries = async () => {
    const { data, error } = await supabase
      .from('roasteries')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRoasteries(data.map((r: any) => ({
        id: r.id,
        name: r.name,
        location: r.location,
        description: r.description,
        rating: r.rating,
        reviewCount: r.review_count,
        specialties: r.specialties,
        website: r.website,
        phone: r.phone,
        address: r.address,
        images: r.images,
        image: r.image,
      })))
    }
    setDataLoading(false)
  }

  useEffect(() => {
    fetchRoasteries()
  }, [])

  const allSpecialties = Array.from(
    new Set(roasteries.flatMap((r) => r.specialties))
  ).sort()

  const filteredRoasteries = roasteries
    .filter((roastery) => {
      const matchesSearch =
        roastery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roastery.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roastery.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSpecialty =
        !selectedSpecialty || roastery.specialties.includes(selectedSpecialty)

      const matchesRating = !minRating || roastery.rating >= minRating

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
          <h1 className="text-4xl font-bold mb-4">Coffee Roasteries</h1>
          <p className="text-gray-600 mb-6">
            Discover and review the best coffee roasters in your area
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search roasteries by name, location, or description..."
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
              <Link href="/roasteries/add">
                <Button className="bg-green-600 hover:bg-green-700">
                  Add Roastery
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
            <p className="text-gray-500 text-lg">Loading roasteries...</p>
          </div>
        ) : filteredRoasteries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No roasteries found matching your search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoasteries.map((roastery) => (
              <Link key={roastery.id} href={`/roasteries/${roastery.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  {roastery.image && (
                    <div className="relative h-48 w-full">
                      <img
                        src={roastery.image}
                        alt={roastery.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{roastery.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {roastery.location}
                        </CardDescription>
                      </div>
                      <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                        <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                        <span className="ml-1 text-sm font-medium">{roastery.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {roastery.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {roastery.specialties.slice(0, 3).map((specialty) => (
                        <span
                          key={specialty}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{roastery.reviewCount} reviews</span>
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
