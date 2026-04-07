import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback')

const PROTECTED = ['/settings']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect exact matches
  if (!PROTECTED.includes(pathname)) return NextResponse.next()

  const token = req.cookies.get('auth_token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/settings'],
}
