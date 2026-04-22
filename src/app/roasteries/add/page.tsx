"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { ImageUpload } from "@/components/image-upload"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddRoasteryPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

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
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [specialties, setSpecialties] = useState("")
  const [website, setWebsite] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [googleMapsLink, setGoogleMapsLink] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("Please log in to submit a roastery")
      return
    }

    // Validate required fields
    if (!name.trim()) {
      setError("Roastery name is required")
      return
    }
    if (!location.trim()) {
      setError("Location is required")
      return
    }
    if (!description.trim()) {
      setError("Description is required")
      return
    }
    if (description.length < 10) {
      setError("Description must be at least 10 characters")
      return
    }

    // Validate website URL if provided
    if (website && !website.match(/^https?:\/\/.+/)) {
      setError("Website must be a valid URL (starting with http:// or https://)")
      return
    }

    // Validate Google Maps link if provided
    if (googleMapsLink && !googleMapsLink.match(/^https?:\/\/.+/)) {
      setError("Google Maps link must be a valid URL (starting with http:// or https://)")
      return
    }

    setSubmitting(true)
    setError("")

    const specialtiesArray = specialties.split(",").map(s => s.trim()).filter(s => s.length > 0)

    const { error: insertError } = await supabase
      .from('roasteries')
      .insert({
        name,
        location,
        description,
        specialties: specialtiesArray,
        website,
        phone,
        address,
        google_maps_link: googleMapsLink || null,
        image: imageUrl,
        rating: 0,
        review_count: 0,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      router.push("/roasteries")
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <Link href="/roasteries" className="inline-flex items-center text-gray-600 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roasteries
          </Link>
          <h1 className="text-4xl font-bold mb-2">Add New Roastery</h1>
          <p className="text-gray-600">Share a coffee roastery with the community</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Roastery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium mb-2 block">
                    Name *
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Roastery name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="text-sm font-medium mb-2 block">
                    Location *
                  </label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State/Country"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="text-sm font-medium mb-2 block">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us about this roastery..."
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="specialties" className="text-sm font-medium mb-2 block">
                    Specialties (comma-separated)
                  </label>
                  <Input
                    id="specialties"
                    value={specialties}
                    onChange={(e) => setSpecialties(e.target.value)}
                    placeholder="e.g. Ethiopian, Natural, Light Roast"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="text-sm font-medium mb-2 block">
                    Website
                  </label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="text-sm font-medium mb-2 block">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="text-sm font-medium mb-2 block">
                    Address
                  </label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address"
                  />
                </div>

                <div>
                  <label htmlFor="googleMapsLink" className="text-sm font-medium mb-2 block">
                    Google Maps Link
                  </label>
                  <Input
                    id="googleMapsLink"
                    type="url"
                    value={googleMapsLink}
                    onChange={(e) => setGoogleMapsLink(e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Image
                  </label>
                  <ImageUpload
                    onUploadComplete={(url) => setImageUrl(url)}
                    onUploadError={(error) => setError(error)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 w-full">
                  {submitting ? "Submitting..." : "Submit Roastery"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
