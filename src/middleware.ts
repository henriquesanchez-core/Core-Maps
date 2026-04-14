import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const MAP_MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function isProtectedRequest(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/settings') return true
  if (pathname.startsWith('/api/settings/')) return true
  if (pathname.startsWith('/api/maps/')) {
    return MAP_MUTATION_METHODS.has(req.method.toUpperCase())
  }

  return false
}

function unauthorized(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/login', req.url)
  const nextPath = `${req.nextUrl.pathname}${req.nextUrl.search}`
  loginUrl.searchParams.set('next', nextPath)
  return NextResponse.redirect(loginUrl)
}

export async function middleware(req: NextRequest) {
  if (!isProtectedRequest(req)) return NextResponse.next()

  const token = req.cookies.get('auth_token')?.value
  if (!token) {
    return unauthorized(req)
  }

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') {
    return unauthorized(req)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/settings', '/api/maps/:path*', '/api/settings/:path*'],
}
