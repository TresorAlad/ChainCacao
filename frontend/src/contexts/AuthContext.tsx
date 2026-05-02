'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  token: string
  actor_id?: string
  role?: string
  email?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (actor_id: string, pin: string) => Promise<User>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('jwt')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({
          token,
          actor_id: payload.actor_id || payload.sub,
          role: payload.role || 'user',
          email: payload.email,
        })
      } catch {
        localStorage.removeItem('jwt')
      }
    }
    setLoading(false)
  }, [])

  const login = async (actor_id: string, pin: string): Promise<User> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_id, pin })
    })
    if (!res.ok) throw new Error('Identifiants invalides')
    const data = await res.json()
    localStorage.setItem('jwt', data.token)
    const payload = JSON.parse(atob(data.token.split('.')[1]))
    const u = {
      token: data.token,
      actor_id: payload.actor_id || payload.sub,
      role: payload.role || 'user',
      email: payload.email,
    }
    setUser(u)
    return u
  }

  const register = async (email: string, password: string, name: string): Promise<void> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Erreur création compte')
    }
  }

  const logout = () => {
    localStorage.removeItem('jwt')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
