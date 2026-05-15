import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'chaincacao_jwt'

function backendBase(): string {
  const raw =
    process.env.API_REWRITE_TARGET ||
    process.env.BACKEND_API_URL ||
    'http://127.0.0.1:8080/api/v1'
  return raw.replace(/\/$/, '')
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const subPath = pathSegments.join('/')
  const target = `${backendBase()}/${subPath}${request.nextUrl.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('connection')

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (token && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  const upstream = await fetch(target, init)
  const resHeaders = new Headers(upstream.headers)
  resHeaders.delete('transfer-encoding')

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  })
}

type RouteCtx = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxy(request, path)
}
export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxy(request, path)
}
export async function PUT(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxy(request, path)
}
export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxy(request, path)
}
export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxy(request, path)
}
