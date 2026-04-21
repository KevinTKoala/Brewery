export type UserRole = 'admin' | 'moderator' | 'user'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  joinedAt: string
  role?: UserRole
}

// Supabase Database Response Types
export interface DatabaseProfile {
  id: string
  name: string
  email: string
  avatar_url?: string
  joined_at: string
  role: UserRole
}

export interface DatabaseDiscussion {
  id: string
  title: string
  content: string
  author_id: string
  category: string
  tags: string[]
  created_at: string
  updated_at: string
  reply_count: number
  view_count: number
  likes: number
  images?: string[]
}

export interface DatabaseReply {
  id: string
  discussion_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  likes: number
}

export interface DatabaseRoastery {
  id: string
  name: string
  location: string
  description: string
  rating: number
  review_count: number
  specialties: string[]
  website?: string
  phone?: string
  address?: string
  images?: string[]
  image?: string
  google_maps_link?: string
  created_at: string
}

export interface DatabaseCafe {
  id: string
  name: string
  location: string
  description: string
  rating: number
  review_count: number
  specialties: string[]
  website?: string
  phone?: string
  address?: string
  hours?: string
  images?: string[]
  image?: string
  google_maps_link?: string
  created_at: string
}

export interface DatabaseReview {
  id: string
  user_id: string
  target_id: string
  target_type: 'roastery' | 'cafe'
  rating: number
  title: string
  content: string
  helpful_count: number
  created_at: string
  image?: string
  helpful_users?: string[]
}

export interface DatabaseCoffeeProduct {
  id: string
  name: string
  category: string
  roastery_id?: string
  price: number
  description: string
  images?: string[]
  in_stock: boolean
  average_rating?: number
  review_count?: number
  specifications?: Record<string, string>
  external_link?: string
}

export interface DatabaseProductReview {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment?: string
  created_at: string
  updated_at: string
}

export interface Roastery {
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
  image?: string
  googleMapsLink?: string
}

export interface Cafe {
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
  hours?: string
  images: string[]
  image?: string
  googleMapsLink?: string
}

export interface Review {
  id: string
  userId: string
  userName: string
  targetId: string
  targetType: 'roastery' | 'cafe'
  rating: number
  title: string
  content: string
  createdAt: string
  helpfulCount: number
  image?: string
  helpfulUsers?: string[]
}

export interface Discussion {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  replyCount: number
  viewCount: number
  likes: number
  images?: string[]
}

export interface Reply {
  id: string
  discussionId: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  content: string
  createdAt: string
  likes: number
}

export interface CoffeeBean {
  id: string
  name: string
  roasteryId: string
  origin: string
  region?: string
  variety?: string
  processingMethod: 'washed' | 'natural' | 'honey' | 'pulped natural' | 'anaerobic'
  roastLevel: 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark'
  flavorNotes: string[]
  altitude?: string
  harvestDate?: string
  price: number
  weight: number
  unit: 'g' | 'kg' | 'lb'
  inStock: boolean
  images: string[]
  averageRating: number
  reviewCount: number
}

export interface BrewingMethod {
  id: string
  name: string
  category: 'pour-over' | 'immersion' | 'espresso' | 'cold brew'
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  brewTime: string
  typicalRatio: string
  equipment: string[]
}

export interface CoffeeProduct {
  id: string
  name: string
  category: 'beans' | 'equipment' | 'accessories'
  roasteryId?: string
  price: number
  description: string
  images: string[]
  inStock: boolean
  averageRating: number
  reviewCount: number
  specifications?: Record<string, string>
  externalLink?: string
}

export interface ProductReview {
  id: string
  productId: string
  userId: string
  rating: number
  comment?: string
  createdAt: string
  updatedAt: string
  user?: {
    username?: string
    avatarUrl?: string
  }
}

export interface Equipment {
  id: string
  name: string
  category: 'grinder' | 'espresso-machine' | 'brewer' | 'kettle' | 'scale' | 'other'
  brand: string
  price: number
  description: string
  features: string[]
  images: string[]
  inStock: boolean
  averageRating: number
  reviewCount: number
}
