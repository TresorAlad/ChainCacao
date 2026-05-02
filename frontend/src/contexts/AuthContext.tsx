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

interface AuthResponse {
  success?: boolean
  token?: string
  actor?: { id?: string; email?: string; role?: string }
  error?: string
  message?: string
}

function networkErrorMessage(): string {
  return (
    'Impossible de contacter l’API (réseau ou blocage navigateur). ' +
    'Si le site est en HTTPS et l’API en HTTP, définissez NEXT_PUBLIC_API_URL=/api/v1 ' +
    'et API_REWRITE_TARGET=http://<hôte-backend>:8080/api/v1 dans l’environnement du serveur Next.'
  )
}

async function parseAuthJson(res: Response): Promise<AuthResponse> {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as AuthResponse
  } catch {
    return {}
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (identifier: string, secret: string, mode?: LoginMode) => Promise<User>
  register: (email: string, password: string, name: string, role?: string) => Promise<boolean>
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
        ? { actor_id: identifier.trim(), pin: secret }
        : { email: identifier.trim().toLowerCase(), password: secret }

    let res: Response
    try {
      res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      throw new Error(networkErrorMessage())
    }

    const data = await parseAuthJson(res)

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Identifiants invalides')
    }

    const token = typeof data.token === 'string' ? data.token : ''
    if (!token) {
      throw new Error(data.error || data.message || 'Réponse serveur sans jeton de session')
    }

    localStorage.setItem('jwt', token)
    const payload = JSON.parse(atob(token.split('.')[1]))
    const emailFromActor =
      data.actor && typeof data.actor === 'object' && typeof data.actor.email === 'string'
        ? data.actor.email
        : undefined
    const u: User = {
      token,
      actor_id: payload.actor_id || payload.sub || data.actor?.id,
      role: payload.role || data.actor?.role || 'user',
      email: payload.email || emailFromActor,
    }
    setUser(u)
    return u
  }

  const register = async (email: string, password: string, name: string, role?: string): Promise<boolean> => {
    const payloadSignup = {
      nom: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      org_id: '',
      role: role || 'agriculteur',
    }

    let res: Response
    try {
      res = await fetch(`${getApiBaseUrl()}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payloadSignup),
      })
    } catch {
      throw new Error(networkErrorMessage())
    }

    const data = await parseAuthJson(res)

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Erreur lors de la création du compte')
    }

    const token = typeof data.token === 'string' ? data.token : ''
    if (!token) {
      throw new Error(
        typeof data.error === 'string'
          ? data.error
          : 'Inscription enregistrée mais aucune session reçue. Connectez-vous avec votre email.'
      )
    }

    localStorage.setItem('jwt', token)
    const jwtPayload = JSON.parse(atob(token.split('.')[1]))
    const emailFromActor =
      data.actor && typeof data.actor === 'object' && typeof data.actor.email === 'string'
        ? data.actor.email
        : undefined
    setUser({
      token,
      actor_id: jwtPayload.actor_id || jwtPayload.sub || data.actor?.id,
      role: jwtPayload.role || data.actor?.role || 'user',
      email: jwtPayload.email || emailFromActor || email.trim().toLowerCase(),
    })
    return true
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
