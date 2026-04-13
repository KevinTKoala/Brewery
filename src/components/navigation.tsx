"use client"

import Link from "next/link"
import { Coffee, Search, MessageSquare, Store, MapPin, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Navigation() {
  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Coffee className="h-6 w-6 text-green-600" />
            <span className="font-bold text-xl">Brewery</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/roasteries" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
              <Store className="h-4 w-4" />
              <span>Roasteries</span>
            </Link>
            <Link href="/cafes" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
              <MapPin className="h-4 w-4" />
              <span>Cafes</span>
            </Link>
            <Link href="/discussions" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
              <MessageSquare className="h-4 w-4" />
              <span>Discussions</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search roasteries, cafes..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 w-48"
              />
            </div>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
