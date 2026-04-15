"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { ImageUpload } from "@/components/image-upload"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddCafePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [specialties, setSpecialties] = useState("")
  const [website, setWebsite] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [hours, setHours] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("Please log in to submit a cafe")
      return
    }

    setSubmitting(true)
    setError("")

    const specialtiesArray = specialties.split(",").map(s => s.trim()).filter(s => s.length > 0)

    const { error: insertError } = await supabase
      .from('cafes')
      .insert({
        name,
        location,
        description,
        specialties: specialtiesArray,
        website,
        phone,
        address,
        hours,
        image: imageUrl,
        rating: 0,
        review_count: 0,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      router.push("/cafes")
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <Link href="/cafes" className="inline-flex items-center text-gray-600 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cafes
          </Link>
          <h1 className="text-4xl font-bold mb-2">Add New Cafe</h1>
          <p className="text-gray-600">Share a coffee cafe with the community</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Cafe Information</CardTitle>
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
                    placeholder="Cafe name"
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
                    placeholder="Tell us about this cafe..."
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    placeholder="e.g. Pour Over, Latte Art, Single Origin"
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
                  <label htmlFor="hours" className="text-sm font-medium mb-2 block">
                    Hours
                  </label>
                  <Input
                    id="hours"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. Mon-Fri 7am-7pm, Sat-Sun 8am-6pm"
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

                <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 w-full">
                  {submitting ? "Submitting..." : "Submit Cafe"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
