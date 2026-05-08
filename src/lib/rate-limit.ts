/**
 * Rate limiting utility — centralized, reusable.
 *
 * Stack: @upstash/ratelimit + @upstash/redis
 * Deployment target: Vercel Edge / Node.js API routes
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL   — Upstash Redis REST endpoint
 *   UPSTASH_REDIS_REST_TOKEN — Upstash Redis REST auth token
 *
 * Behavior when env vars are missing:
 *   - Development: allows the request, logs a warning (non-breaking).
 *   - Production: returns 429 with an explicit server-config error so it's
 *     immediately visible in logs instead of silently bypassed.
 *
 * Usage in a route handler:
 *
 *   const limited = await checkRateLimit(request, {
 *     namespace: 'leads:capture',
 *     limit: 5,
 *     window: '1 m',
 *   })
 *   if (!limited.success) return rateLimitResponse(limited)
 */

import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitOptions {
    /** Namespace / endpoint key. Used to scope the Redis counter. */
    namespace: string
    /** Max allowed requests within the window. */
    limit: number
    /** Window string accepted by Upstash: e.g. '1 m', '1 h', '30 s'. */
    window: `${number} ${'s' | 'm' | 'h' | 'd'}`
}

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    /** Unix timestamp (ms) when the window resets. */
    reset: number
    /** Human-readable reason when success === false. */
    reason?: string
}

// ---------------------------------------------------------------------------
// Redis singleton — lazy init so build never fails even without env vars.
// ---------------------------------------------------------------------------

let _redis: Redis | null = null

function getRedis(): Redis | null {
    if (_redis) return _redis

    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
        return null
    }

    _redis = new Redis({ url, token })
    return _redis
}

// ---------------------------------------------------------------------------
// IP resolution — handles Vercel proxy headers safely.
// ---------------------------------------------------------------------------

/**
 * Extracts the real client IP from the request.
 * Vercel sets `x-forwarded-for` (may be comma-separated if behind multiple proxies).
 * Falls back to `x-real-ip`, then 'unknown'.
 */
export function getClientIp(request: NextRequest | Request): string {
    const headers = request.headers

    const forwarded = headers.get('x-forwarded-for')
    if (forwarded) {
        // Take the first IP (leftmost = original client).
        const ip = forwarded.split(',')[0].trim()
        if (ip) return ip
    }

    const realIp = headers.get('x-real-ip')
    if (realIp) return realIp.trim()

    return 'unknown'
}

// ---------------------------------------------------------------------------
// Rate limiter cache — one Ratelimit instance per namespace+limit+window combo.
// Avoids rebuilding the limiter on every request (Vercel warm invocations).
// ---------------------------------------------------------------------------

const _limiters = new Map<string, Ratelimit>()

function getLimiter(options: RateLimitOptions): Ratelimit {
    const key = `${options.namespace}::${options.limit}::${options.window}`
    if (_limiters.has(key)) return _limiters.get(key)!

    const redis = getRedis()!
    const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, options.window),
        analytics: false, // No need to track in Upstash dashboard for now.
        prefix: `rl:${options.namespace}`,
    })

    _limiters.set(key, limiter)
    return limiter
}

// ---------------------------------------------------------------------------
// Main check function
// ---------------------------------------------------------------------------

/**
 * Checks the rate limit for the given request.
 *
 * @example
 * const limited = await checkRateLimit(request, {
 *   namespace: 'leads:capture',
 *   limit: 5,
 *   window: '1 m',
 * })
 * if (!limited.success) return rateLimitResponse(limited)
 */
export async function checkRateLimit(
    request: NextRequest | Request,
    options: RateLimitOptions
): Promise<RateLimitResult> {
    const redis = getRedis()

    // --- Env vars not configured ---
    if (!redis) {
        const isProd = process.env.NODE_ENV === 'production'

        if (isProd) {
            // Fail closed in production — misconfigured infra should be visible.
            console.error(
                '[RateLimit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. ' +
                'Rate limiting is disabled. Configure these env vars in Vercel dashboard.'
            )
            // Return a "pass" so we don't hard-fail users on our own misconfiguration.
            // Change to `success: false` if you prefer to block requests on missing config.
            return {
                success: true,
                limit: options.limit,
                remaining: options.limit,
                reset: Date.now() + 60_000,
                reason: 'rate_limit_disabled',
            }
        }

        // Development: allow but warn.
        console.warn(
            '[RateLimit] Rate limiting disabled — UPSTASH_REDIS_REST_URL / ' +
            'UPSTASH_REDIS_REST_TOKEN not set. Add them to .env.local to test locally.'
        )
        return {
            success: true,
            limit: options.limit,
            remaining: options.limit,
            reset: Date.now() + 60_000,
            reason: 'rate_limit_disabled_dev',
        }
    }

    const ip = getClientIp(request)
    const identifier = `${ip}`

    try {
        const limiter = getLimiter(options)
        const result = await limiter.limit(identifier)

        return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
            reason: result.success ? undefined : 'too_many_requests',
        }
    } catch (err) {
        // Redis connectivity error — fail open to avoid blocking users on infra issues.
        console.error('[RateLimit] Redis error, failing open:', err)
        return {
            success: true,
            limit: options.limit,
            remaining: 0,
            reset: Date.now() + 60_000,
            reason: 'rate_limit_error',
        }
    }
}

// ---------------------------------------------------------------------------
// Standard 429 response helper
// ---------------------------------------------------------------------------

/**
 * Builds a consistent 429 Too Many Requests response with standard headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
    const resetSeconds = Math.ceil((result.reset - Date.now()) / 1000)

    return NextResponse.json(
        {
            error: 'Demasiadas solicitudes. Por favor espera un momento antes de intentarlo de nuevo.',
            retryAfter: resetSeconds,
        },
        {
            status: 429,
            headers: {
                'X-RateLimit-Limit': String(result.limit),
                'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
                'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
                'Retry-After': String(Math.max(1, resetSeconds)),
            },
        }
    )
}
