/**
 * Shared backend security helpers for NELFUND Student Guide APIs.
 * - Timing-safe secret compare
 * - Origin allow-list CORS
 * - Basic IP rate limiting (per instance + optional Redis later)
 * - Client IP extraction behind Vercel
 * - Security response headers
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { timingSafeEqual } from 'crypto'

const DEFAULT_ORIGINS = [
  'https://nelfund-student-guide.vercel.app',
  'https://nelfund-student-guide-git-main.vercel.app',
]

function envOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS || ''
  const extra = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const out = new Set([...DEFAULT_ORIGINS, ...extra])
  if (process.env.VERCEL_URL) {
    out.add(`https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`)
  }
  out.add('http://localhost:5173')
  out.add('http://localhost:3000')
  out.add('http://127.0.0.1:5173')
  return [...out]
}

export function clientIp(req: VercelRequest): string {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim().slice(0, 64)
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).split(',')[0].trim().slice(0, 64)
  const real = req.headers['x-real-ip']
  if (typeof real === 'string' && real) return real.slice(0, 64)
  return 'unknown'
}

/** Constant-time string equality for secrets. */
export function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(String(a))
    const bb = Buffer.from(String(b))
    if (ba.length !== bb.length) {
      const pad = Buffer.alloc(ba.length)
      timingSafeEqual(ba, pad)
      return false
    }
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

export function adminAuthorized(req: VercelRequest): boolean {
  const expected = process.env.ANALYTICS_ADMIN_KEY || ''
  if (!expected || expected.length < 24) return false
  const provided = req.headers['x-admin-key']
  if (typeof provided !== 'string' || !provided) return false
  return safeEqual(provided, expected)
}

export function cronAuthorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET || ''
  if (!secret || secret.length < 16) return false
  const auth = req.headers.authorization
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return safeEqual(auth.slice(7), secret)
  }
  if (typeof req.headers['x-vercel-cron'] !== 'undefined') {
    return true
  }
  return false
}

export function evalAuthorized(req: VercelRequest): boolean {
  const secret = process.env.EVAL_SECRET || ''
  if (!secret || secret.length < 16) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') return false
    return true
  }
  const provided = (req.headers['x-eval-secret'] as string) || ''
  return safeEqual(provided, secret)
}

export function applySecurityHeaders(res: VercelResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
}

export function applyCors(req: VercelRequest, res: VercelResponse, methods: string): boolean {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : ''
  const allowed = envOrigins()
  applySecurityHeaders(res)
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  } else if (!origin) {
    // same-origin / server-to-server
  } else if (process.env.CORS_RELAX === '1') {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowed[0])
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-admin-key, x-eval-secret',
  )
  res.setHeader('Access-Control-Max-Age', '86400')
  return true
}

type Bucket = { count: number; reset: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now()
  let b = buckets.get(key)
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs }
    buckets.set(key, b)
  }
  b.count += 1
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now > v.reset) buckets.delete(k)
    }
  }
  const remaining = Math.max(0, limit - b.count)
  return { ok: b.count <= limit, remaining }
}

export function rateLimitOr429(
  req: VercelRequest,
  res: VercelResponse,
  scope: string,
  limit: number,
  windowMs: number,
): boolean {
  const ip = clientIp(req)
  const { ok, remaining } = rateLimit(`${scope}:${ip}`, limit, windowMs)
  res.setHeader('X-RateLimit-Limit', String(limit))
  res.setHeader('X-RateLimit-Remaining', String(remaining))
  if (!ok) {
    res.status(429).json({ error: 'rate_limited', message: 'Too many requests. Try again shortly.' })
    return false
  }
  return true
}

export function maxBodyBytes(req: VercelRequest, max: number): boolean {
  const len = Number(req.headers['content-length'] || 0)
  if (Number.isFinite(len) && len > max) return false
  return true
}
