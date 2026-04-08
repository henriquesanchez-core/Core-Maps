import { NextResponse } from 'next/server'
import { createToken } from '@/lib/auth'
import {
  LOGIN_ATTEMPT_WINDOW_MS,
  LOGIN_MAX_ATTEMPTS_PER_WINDOW,
  LOGIN_MIN_RESPONSE_DELAY_MS,
} from '@/lib/constants'
import { LoginRequestSchema } from '@/lib/validation'

type LoginAttempt = {
  count: number
  resetAt: number
}

const attemptsByIp = new Map<string, LoginAttempt>()

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}

function isRateLimited(ip: string, now: number): boolean {
  for (const [key, value] of attemptsByIp.entries()) {
    if (value.resetAt <= now) {
      attemptsByIp.delete(key)
    }
  }

  const current = attemptsByIp.get(ip)
  if (!current || current.resetAt <= now) {
    attemptsByIp.set(ip, {
      count: 1,
      resetAt: now + LOGIN_ATTEMPT_WINDOW_MS,
    })
    return false
  }

  if (current.count >= LOGIN_MAX_ATTEMPTS_PER_WINDOW) {
    return true
  }

  current.count += 1
  attemptsByIp.set(ip, current)
  return false
}

async function applyMinimumDelay(startedAt: number): Promise<void> {
  const elapsed = Date.now() - startedAt
  if (elapsed >= LOGIN_MIN_RESPONSE_DELAY_MS) return

  await new Promise((resolve) => {
    setTimeout(resolve, LOGIN_MIN_RESPONSE_DELAY_MS - elapsed)
  })
}

export async function POST(req: Request) {
  const startedAt = Date.now()

  try {
    const clientIp = getClientIp(req)
    const now = Date.now()
    if (isRateLimited(clientIp, now)) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido no body' }, { status: 400 })
    }

    const parsedBody = LoginRequestSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const email = typeof (body as { email?: unknown }).email === 'string'
      ? (body as { email: string }).email
      : ''
    const { password } = parsedBody.data

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = await createToken()
      const res = NextResponse.json({ success: true })
      res.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      return res
    }

    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  } finally {
    await applyMinimumDelay(startedAt)
  }
}
