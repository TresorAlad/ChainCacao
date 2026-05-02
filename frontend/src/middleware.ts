import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_SESSION_COOKIE_NAME, AUTH_SESSION_COOKIE_VALUE } from '@/lib/auth-session-cookie'

function isPublicPath(pathname: string): boolean {
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/compte-application-mobile'
  ) {
    return true
  }
  if (pathname === '/verify' || pathname.startsWith('/verify/')) return true
  return false
}

const STATIC_FILE = /\.(?:ico|png|jpg|jpeg|gif|svg|webp|txt|xml|woff2?)$/i

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api')) return NextResponse.next()
  if (STATIC_FILE.test(pathname)) return NextResponse.next()
  if (isPublicPath(pathname)) return NextResponse.next()

  const ok =
    request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value === AUTH_SESSION_COOKIE_VALUE
  if (!ok) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
