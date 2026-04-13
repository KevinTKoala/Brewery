"use client"

import { useState } from "react"
import { Search, Star, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cafes } from "@/lib/data"
import Link from "next/link"

export default function CafesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCafes = cafes.filter((cafe) => {
    return (
      cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cafe.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cafe.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4">Coffee Cafes</h1>
          <p className="text-gray-600 mb-6">
            Find the best cafes near you with reviews from coffee enthusiasts
          </p>

          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search cafes by name, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {filteredCafes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No cafes found matching your search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCafes.map((cafe) => (
              <Link key={cafe.id} href={`/cafes/${cafe.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
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
