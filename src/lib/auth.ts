import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const AUTH_COOKIE_NAME = 'auth_token'

function getSecret(): Uint8Array {
  const authSecret = process.env.AUTH_SECRET
  if (!authSecret || authSecret.length < 32) {
    throw new Error('AUTH_SECRET is required and must be at least 32 characters long.')
  }
  return new TextEncoder().encode(authSecret)
}

export async function createToken() {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null

  const pairs = cookieHeader.split(';')
  for (const pair of pairs) {
    const [key, ...rest] = pair.trim().split('=')
    if (key === name) {
      return decodeURIComponent(rest.join('='))
    }
  }

  return null
}

function unauthorizedResponse(message: string) {
  return new Response(JSON.stringify({ error: 'Unauthorized', message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function requireAdmin(request: Request): Promise<JWTPayload> {
  const token = getCookieValue(request.headers.get('cookie'), AUTH_COOKIE_NAME)

  if (!token) {
    throw unauthorizedResponse('Missing auth token.')
  }

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') {
    throw unauthorizedResponse('Invalid auth token.')
  }

  return payload
}
