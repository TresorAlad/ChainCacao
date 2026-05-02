'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getApiBaseUrl, SESSION_EXPIRED_EVENT } from '@/lib/api-base'

interface User {
  token: string
  actor_id?: string
  role?: string
  email?: string
}

type LoginMode = 'email' | 'actor'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (identifier: string, secret: string, mode?: LoginMode) => Promise<User>
  register: (email: string, password: string, name: string) => Promise<boolean>
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

  useEffect(() => {
    const onSessionExpired = () => setUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [])

  const login = async (
    identifier: string,
    secret: string,
    mode: LoginMode = 'email'
  ): Promise<User> => {
    const body =
      mode === 'actor'
        ? { actor_id: identifier, pin: secret }
        : { email: identifier.trim(), password: secret }
    const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || err.message || 'Identifiants invalides')
    }
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

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    const res = await fetch(`${getApiBaseUrl()}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: name, email, password, org_id: '' }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || err.message || 'Erreur création compte')
    }
    const data = await res.json().catch(() => ({}))
    if (data.token) {
      localStorage.setItem('jwt', data.token)
      const payload = JSON.parse(atob(data.token.split('.')[1]))
      setUser({
        token: data.token,
        actor_id: payload.actor_id || payload.sub,
        role: payload.role || 'user',
        email: payload.email,
      })
      return true
    }
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Inscription enregistrée mais aucune session reçue. Connectez-vous avec votre email.'
    )
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
