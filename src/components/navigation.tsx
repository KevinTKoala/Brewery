"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Coffee, Search, MessageSquare, Store, MapPin, User, LogOut, Shield, ShoppingBag, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

export function Navigation() {
  const { user, logout } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAvatar()
    }
  }, [user])

  const fetchAvatar = async () => {
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profileData?.avatar_url) {
      setAvatarUrl(profileData.avatar_url)
    }
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2" aria-label="Brewery home">
            <Coffee className="h-6 w-6 text-green-600" aria-hidden="true" />
            <span className="font-bold text-xl">Brewery</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/roasteries" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors" aria-label="View roasteries">
              <Store className="h-4 w-4" aria-hidden="true" />
              <span>Roasteries</span>
            </Link>
            <Link href="/cafes" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors" aria-label="View cafes">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>Cafes</span>
            </Link>
            <Link href="/marketplace" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors" aria-label="View marketplace">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span>Marketplace</span>
            </Link>
            <Link href="/discussions" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors" aria-label="View discussions">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              <span>Discussions</span>
            </Link>
            {(user?.role === 'admin' || user?.role === 'moderator') && (
              <Link href="/moderator" className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors" aria-label="View moderator dashboard">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>Moderator</span>
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors" aria-label="View admin dashboard">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <div className="hidden sm:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search roasteries, cafes..."
                aria-label="Search roasteries, cafes, and marketplace"
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 w-48"
              />
            </div>
            {user ? (
              <div className="flex items-center space-x-2">
                <Link href="/profile" className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 hover:text-green-600 transition-colors" aria-label="View your profile">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${user.name}'s avatar`}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>Profile</span>
                </Link>
                <Link href="/profile" className="sm:hidden" aria-label="View your profile">
                  <Button variant="ghost" size="icon">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${user.name}'s avatar`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" aria-hidden="true" />
                    )}
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <Link href="/login" aria-label="Login to your account">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link href="/roasteries" className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <Store className="h-4 w-4" />
                <span>Roasteries</span>
              </Link>
              <Link href="/cafes" className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <MapPin className="h-4 w-4" />
                <span>Cafes</span>
              </Link>
              <Link href="/marketplace" className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <ShoppingBag className="h-4 w-4" />
                <span>Marketplace</span>
              </Link>
              <Link href="/discussions" className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <MessageSquare className="h-4 w-4" />
                <span>Discussions</span>
              </Link>
              {(user?.role === 'admin' || user?.role === 'moderator') && (
                <Link href="/moderator" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <Shield className="h-4 w-4" />
                  <span>Moderator</span>
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link href="/admin" className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              <div className="pt-4 border-t">
                <Input
                  type="text"
                  placeholder="Search roasteries, cafes..."
                  aria-label="Search roasteries, cafes, and marketplace"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
