'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getApiBaseUrl, SESSION_EXPIRED_EVENT } from '@/lib/api-base'
import { mapRoleToApiRole } from '@/lib/role-utils'
import {
  type SignupChannel,
  setSignupChannel,
  getSignupChannel,
  clearSignupChannel,
} from '@/lib/signup-channel-storage'
import { setAuthSessionCookie, clearAuthSessionCookie } from '@/lib/auth-session-cookie'

export type RegisterExtras = {
  gps_location?: string
  field_surface?: string
  org_name?: string
  pin_code?: string
  preferred_client?: SignupChannel
}

interface User {
  token: string
  actor_id?: string
  role?: string
  email?: string
  /** Préférence d’interface mémorisée sur ce navigateur (inscription). */
  clientChannel?: SignupChannel | null
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
  return "Impossible de joindre le serveur. Vérifiez votre connexion internet."
}

/** Extrait un message d'erreur lisible depuis la réponse JSON (data.error peut être un objet ou une string). */
function extractApiError(data: AuthResponse, fallback: string): string {
  if (typeof data.error === 'string' && data.error.trim()) return data.error
  if (typeof data.message === 'string' && data.message.trim()) return data.message
  if (data.error && typeof data.error === 'object') {
    const e = data.error as Record<string, unknown>
    if (typeof e.message === 'string') return e.message
  }
  return fallback
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

function userFromToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const actorId = (payload.actor_id || payload.sub) as string | undefined
    return {
      token,
      actor_id: actorId,
      role: payload.role || 'user',
      email: payload.email,
      clientChannel: getSignupChannel(actorId),
    }
  } catch {
    return null
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (identifier: string, secret: string, mode?: LoginMode) => Promise<User>
  register: (
    email: string,
    password: string,
    name: string,
    role?: string,
    extras?: RegisterExtras
  ) => Promise<string>
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
      const u = userFromToken(token)
      if (u) {
        setUser(u)
        setAuthSessionCookie()
      } else localStorage.removeItem('jwt')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const onSessionExpired = () => {
      clearAuthSessionCookie()
      setUser(null)
    }
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
      throw new Error(extractApiError(data, 'Identifiants invalides'))
    }

    const token = typeof data.token === 'string' ? data.token : ''
    if (!token) {
      throw new Error(extractApiError(data, 'Réponse serveur sans jeton de session'))
    }

    localStorage.setItem('jwt', token)
    setAuthSessionCookie()
    const emailFromActor =
      data.actor && typeof data.actor === 'object' && typeof data.actor.email === 'string'
        ? data.actor.email
        : undefined
    const base = userFromToken(token)
    if (!base) {
      throw new Error('Jeton de session invalide')
    }
    const u: User = {
      ...base,
      email: base.email || emailFromActor,
      clientChannel: getSignupChannel(base.actor_id),
    }
    setUser(u)
    return u
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    role?: string,
    extras?: RegisterExtras
  ): Promise<string> => {
    const apiRole = mapRoleToApiRole(role || 'agriculteur')
    const payloadSignup: Record<string, string> = {
      nom: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      org_id: '',
      role: apiRole,
    }
    const g = extras?.gps_location?.trim()
    const fs = extras?.field_surface?.trim()
    const on = extras?.org_name?.trim()
    const pin = extras?.pin_code?.trim()
    if (g) payloadSignup.gps_location = g
    if (fs) payloadSignup.field_surface = fs
    if (on) payloadSignup.org_name = on
    if (pin) payloadSignup.pin_code = pin

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
      throw new Error(extractApiError(data, 'Erreur lors de la création du compte'))
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
    setAuthSessionCookie()
    const jwtPayload = JSON.parse(atob(token.split('.')[1]))
    const actorId = (jwtPayload.actor_id || jwtPayload.sub || data.actor?.id) as string | undefined
    const emailFromActor =
      data.actor && typeof data.actor === 'object' && typeof data.actor.email === 'string'
        ? data.actor.email
        : undefined

    if (actorId) {
      if (extras?.preferred_client === 'mobile') {
        setSignupChannel(actorId, 'mobile')
      } else if (extras?.preferred_client === 'web') {
        clearSignupChannel(actorId)
      }
    }

    const pref = extras?.preferred_client
    const clientChannel: SignupChannel | null =
      pref === 'mobile' || pref === 'web' ? pref : getSignupChannel(actorId)

    const resolvedRole = (jwtPayload.role || data.actor?.role || 'user') as string
    setUser({
      token,
      actor_id: actorId,
      role: resolvedRole,
      email: jwtPayload.email || emailFromActor || email.trim().toLowerCase(),
      clientChannel,
    })
    return resolvedRole
  }

  const logout = () => {
    localStorage.removeItem('jwt')
    clearAuthSessionCookie()
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
