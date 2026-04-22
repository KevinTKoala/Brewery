"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"
import { User } from "@/types"
import { supabase } from "@/lib/supabase"
import { Session, AuthError } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const loadingSetRef = useRef(false)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const setLoadingFalse = () => {
      if (!loadingSetRef.current && mounted) {
        setLoading(false)
        loadingSetRef.current = true
      }
    }

    // Check if user is logged in on mount
    const initializeAuth = async () => {
      try {
        console.log('Auth: Initializing auth check...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Auth: Session retrieved', session ? 'User logged in' : 'No session')

        if (mounted) {
          if (session?.user) {
            console.log('Auth: Fetching profile for user', session.user.id)
            await fetchProfile(session.user.id, session.user)
          } else {
            console.log('Auth: No user session, setting user to null')
            setUser(null)
          }

          clearTimeout(timeoutId)
          setLoadingFalse()
          console.log('Auth: Initialization complete')
        }
      } catch (error) {
        console.error('Auth: Error during initialization', error)
        if (mounted) {
          setUser(null)
          clearTimeout(timeoutId)
          setLoadingFalse()
        }
      }
    }

    initializeAuth()

    // Set a timeout to prevent infinite loading - this is critical for mobile/ngrok
    timeoutId = setTimeout(() => {
      if (mounted && !loadingSetRef.current) {
        console.warn('Auth initialization timeout - setting user to null')
        setUser(null)
        setLoadingFalse()
      }
    }, 2000) // 2 second timeout for faster fallback

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth: State changed', event, session ? 'Session exists' : 'No session')
      if (mounted) {
        if (session?.user) {
          await fetchProfile(session.user.id, session.user)
        } else {
          setUser(null)
        }
        setLoadingFalse()
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string, sessionUser?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Fallback to session user data if profile fetch fails
        if (sessionUser) {
          setUser({
            id: sessionUser.id,
            name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
            email: sessionUser.email,
            avatar: sessionUser.user_metadata?.avatar_url,
            joinedAt: sessionUser.created_at,
            role: 'user'
          })
        }
        return
      }

      if (data) {
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          joinedAt: data.joined_at,
          role: data.role || 'user'
        })
      }
    } catch (err) {
      // Fallback to session user data if profile fetch fails
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
          email: sessionUser.email,
          avatar: sessionUser.user_metadata?.avatar_url,
          joinedAt: sessionUser.created_at,
          role: 'user'
        })
      }
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
