"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Coffee, Trash2, Eye, MapPin, Star, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

interface Roastery {
  id: string
  name: string
  location: string
  description: string
  rating: number
  reviewCount: number
  specialties: string[]
  website?: string
  phone?: string
  address?: string
  images: string[]
  created_at: string
}

export default function AdminRoasteriesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [roasteries, setRoasteries] = useState<Roastery[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoastery, setSelectedRoastery] = useState<Roastery | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    description: "",
    specialties: "",
    website: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchRoasteries()
  }, [user, router])

  const fetchRoasteries = async () => {
    setLoading(true)
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
        specialties: r.specialties || [],
        website: r.website,
        phone: r.phone,
        address: r.address,
        images: r.images || [],
        created_at: r.created_at,
      })))
    }
    setLoading(false)
  }

  const filteredRoasteries = roasteries.filter(roastery =>
    roastery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roastery.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteRoastery = async (roasteryId: string) => {
    if (!confirm('Are you sure you want to delete this roastery? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('roasteries')
      .delete()
      .eq('id', roasteryId)

    if (error) {
      alert('Failed to delete roastery: ' + error.message)
    } else {
      fetchRoasteries()
    }
  }

  const handleUpdateRoastery = async () => {
    if (!selectedRoastery) return

    setUpdating(true)
    const specialtiesArray = editForm.specialties.split(',').map(s => s.trim()).filter(s => s)

    const { error } = await supabase
      .from('roasteries')
      .update({
        name: editForm.name,
        location: editForm.location,
        description: editForm.description,
        specialties: specialtiesArray,
        website: editForm.website || null,
        phone: editForm.phone || null,
        address: editForm.address || null,
      })
      .eq('id', selectedRoastery.id)

    if (error) {
      alert('Failed to update roastery: ' + error.message)
    } else {
      setShowEditModal(false)
      setSelectedRoastery(null)
      fetchRoasteries()
    }
    setUpdating(false)
  }

  const openEditModal = (roastery: Roastery) => {
    setSelectedRoastery(roastery)
    setEditForm({
      name: roastery.name,
      location: roastery.location,
      description: roastery.description,
      specialties: roastery.specialties.join(', '),
      website: roastery.website || '',
      phone: roastery.phone || '',
      address: roastery.address || '',
    })
    setShowEditModal(true)
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
              <h1 className="text-4xl font-bold mb-2">Manage Roasteries</h1>
              <p className="text-gray-600">View and manage all platform roasteries</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Roasteries ({filteredRoasteries.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search roasteries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-gray-600">Roastery</th>
                    <th className="text-left p-4 font-medium text-gray-600">Location</th>
                    <th className="text-left p-4 font-medium text-gray-600">Rating</th>
                    <th className="text-left p-4 font-medium text-gray-600">Reviews</th>
                    <th className="text-left p-4 font-medium text-gray-600">Added</th>
                    <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoasteries.map((roastery) => (
                    <tr key={roastery.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Coffee className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <span className="font-medium block">{roastery.name}</span>
                            <span className="text-xs text-gray-500">{roastery.specialties.slice(0, 2).join(', ')}{roastery.specialties.length > 2 ? '...' : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {roastery.location}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{roastery.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{roastery.reviewCount}</td>
                      <td className="p-4 text-gray-600">
                        {new Date(roastery.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(roastery)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/roasteries/${roastery.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRoastery(roastery.id)}
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
      </div>

      {/* Edit Roastery Modal */}
      {showEditModal && selectedRoastery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Roastery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md min-h-24"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Specialties (comma-separated)</label>
                  <Input
                    value={editForm.specialties}
                    onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                    placeholder="e.g., Single Origin, Espresso, Cold Brew"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Website</label>
                  <Input
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Phone</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Address</label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateRoastery} disabled={updating}>
                    {updating ? 'Updating...' : 'Update Roastery'}
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
