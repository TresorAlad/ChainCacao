import { NextRequest, NextResponse } from 'next/server'
import { decodeJwtPayload, isJwtExpired } from '@/lib/jwt-utils'

const COOKIE_NAME = 'chaincacao_jwt'
const MAX_AGE = 60 * 60 * 24

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: MAX_AGE,
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token || isJwtExpired(token)) {
    return NextResponse.json({ success: false, error: 'session absente ou expiree' }, { status: 401 })
  }
  const payload = decodeJwtPayload(token)
  if (!payload) {
    return NextResponse.json({ success: false, error: 'token invalide' }, { status: 401 })
  }
  return NextResponse.json({
    success: true,
    token,
    actor: {
      id: (payload.actor_id as string) || (payload.sub as string),
      role: payload.role as string,
      org_id: payload.org_id as string,
    },
  })
}

export async function POST(request: NextRequest) {
  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'payload invalide' }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token || isJwtExpired(token)) {
    return NextResponse.json({ error: 'token invalide ou expire' }, { status: 400 })
  }
  const secure = request.nextUrl.protocol === 'https:'
  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE_NAME, token, cookieOptions(secure))
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE_NAME, '', { ...cookieOptions(false), maxAge: 0 })
  return res
}
