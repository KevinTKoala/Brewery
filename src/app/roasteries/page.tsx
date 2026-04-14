"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Star, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Roastery } from "@/types"

export default function RoasteriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [roasteries, setRoasteries] = useState<Roastery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoasteries()
  }, [])

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
      })))
    }
    setLoading(false)
  }

  const allSpecialties = Array.from(
    new Set(roasteries.flatMap((r) => r.specialties))
  ).sort()

  const filteredRoasteries = roasteries.filter((roastery) => {
    const matchesSearch =
      roastery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roastery.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roastery.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSpecialty =
      !selectedSpecialty || roastery.specialties.includes(selectedSpecialty)

    return matchesSearch && matchesSpecialty
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
            <div className="flex gap-2 flex-wrap items-center">
              <Button
                variant={!selectedSpecialty ? "default" : "outline"}
                onClick={() => setSelectedSpecialty(null)}
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
