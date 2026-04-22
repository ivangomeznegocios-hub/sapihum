import dotenv from 'dotenv'
import { expect, test, type Page } from '@playwright/test'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: process.env.PLAYWRIGHT_ENV_FILE ?? '.env.local', quiet: true })

const PASSWORD = 'test1234'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
const RUN_SEEDED_AUTH_AUDITS = process.env.PLAYWRIGHT_RUN_SEEDED_AUTH_AUDITS === '1'

test.skip(
  !RUN_SEEDED_AUTH_AUDITS,
  'Seeded auth audits require PLAYWRIGHT_RUN_SEEDED_AUTH_AUDITS=1 and the @test users to exist.'
)

function createSessionSupabase(
  setCookies: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => void
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables for permission audit.')
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return []
      },
      setAll(cookiesToSet) {
        setCookies(cookiesToSet)
      },
    },
  })
}

function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials for permission audit.')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function toSameSite(value: unknown): 'Lax' | 'None' | 'Strict' {
  if (value === 'none' || value === 'None') return 'None'
  if (value === 'strict' || value === 'Strict') return 'Strict'
  return 'Lax'
}

async function createSessionCookies(email: string) {
  const pendingCookies: Array<{
    name: string
    value: string
    options?: Record<string, unknown>
  }> = []

  const supabase = createSessionSupabase((cookiesToSet) => {
    pendingCookies.splice(0, pendingCookies.length, ...cookiesToSet)
  })

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: PASSWORD,
  })

  if (error) {
    throw new Error(`Unable to create session for ${email}: ${error.message}`)
  }

  return pendingCookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    url: BASE_URL,
    httpOnly: Boolean(cookie.options?.httpOnly),
    secure: Boolean(cookie.options?.secure),
    sameSite: toSameSite(cookie.options?.sameSite),
  }))
}

async function signInAs(page: Page, email: string) {
  await page.context().clearCookies()
  await page.context().addCookies(await createSessionCookies(email))
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForLoadState('networkidle').catch(() => null)
}

async function findAuthUserIdByEmail(email: string) {
  const admin = createAdminSupabase()
  const normalizedEmail = email.trim().toLowerCase()

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) {
      throw new Error(`Unable to list auth users: ${error.message}`)
    }

    const match = (data?.users ?? []).find((entry) => entry.email?.trim().toLowerCase() === normalizedEmail)
    if (match) {
      return match.id
    }

    if ((data?.users ?? []).length < 200) {
      break
    }
  }

  throw new Error(`Unable to find auth user for ${email}`)
}

test.describe('server route permissions', () => {
  test.describe.configure({ mode: 'serial' })

  test('psychologist level 2 is redirected away from forbidden create routes', async ({ page }) => {
    test.setTimeout(120_000)
    await signInAs(page, 'psicologo2@test.com')

    const forbiddenRoutes = [
      { path: '/dashboard/admin/speakers/new', expectedPath: '/dashboard' },
      { path: '/dashboard/resources/new', expectedPath: '/dashboard/resources' },
    ]

    for (const route of forbiddenRoutes) {
      await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await page.waitForLoadState('networkidle').catch(() => null)
      expect(new URL(page.url()).pathname).toBe(route.expectedPath)
    }
  })

  test('admin keeps access to admin speaker creation', async ({ page }) => {
    test.setTimeout(120_000)
    await signInAs(page, 'admin@test.com')

    await page.goto('/dashboard/admin/speakers/new', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForLoadState('networkidle').catch(() => null)

    expect(new URL(page.url()).pathname).toBe('/dashboard/admin/speakers/new')
  })

  test('ponente keeps access to resource creation', async ({ page }) => {
    test.setTimeout(120_000)
    await signInAs(page, 'ponente@test.com')

    await page.goto('/dashboard/resources/new', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForLoadState('networkidle').catch(() => null)

    expect(new URL(page.url()).pathname).toBe('/dashboard/resources/new')
  })

  test('paid member without local subscription detail still sees the Stripe portal CTA', async ({ page }) => {
    test.setTimeout(180_000)

    const admin = createAdminSupabase()
    const userId = await findAuthUserIdByEmail('psicologo2@test.com')

    const { data: originalProfile, error: profileError } = await admin
      .from('profiles')
      .select('membership_level, subscription_status, membership_specialization_code, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !originalProfile) {
      throw new Error(`Unable to load original profile for billing CTA audit: ${profileError?.message ?? 'missing profile'}`)
    }

    const { data: originalSubscription, error: subscriptionError } = await admin
      .from('subscriptions')
      .select('id, status, provider_customer_id, current_period_end, cancel_at_period_end, cancelled_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      throw new Error(`Unable to load subscription snapshot for billing CTA audit: ${subscriptionError.message}`)
    }

    try {
      const { error: updateProfileError } = await admin
        .from('profiles')
        .update({
          membership_level: 2,
          subscription_status: 'active',
          stripe_customer_id: null,
        })
        .eq('id', userId)

      if (updateProfileError) {
        throw new Error(`Unable to prepare billing CTA profile state: ${updateProfileError.message}`)
      }

      if (originalSubscription?.id) {
        const { error: updateSubscriptionError } = await admin
          .from('subscriptions')
          .update({
            status: 'expired',
            provider_customer_id: null,
            current_period_end: new Date().toISOString(),
            cancel_at_period_end: false,
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', originalSubscription.id)

        if (updateSubscriptionError) {
          throw new Error(`Unable to prepare billing CTA subscription state: ${updateSubscriptionError.message}`)
        }
      }

      await signInAs(page, 'psicologo2@test.com')
      await page.goto('/dashboard/subscription', { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await page.waitForLoadState('networkidle').catch(() => null)

      await expect(page.getByText('Tu acceso esta activo, pero aun no vemos el detalle de suscripcion en esta vista.')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Abrir portal de Stripe' })).toBeVisible()
    } finally {
      await admin
        .from('profiles')
        .update({
          membership_level: originalProfile.membership_level,
          subscription_status: originalProfile.subscription_status,
          membership_specialization_code: originalProfile.membership_specialization_code,
          stripe_customer_id: originalProfile.stripe_customer_id,
        })
        .eq('id', userId)

      if (originalSubscription?.id) {
        await admin
          .from('subscriptions')
          .update({
            status: originalSubscription.status,
            provider_customer_id: originalSubscription.provider_customer_id,
            current_period_end: originalSubscription.current_period_end,
            cancel_at_period_end: originalSubscription.cancel_at_period_end,
            cancelled_at: originalSubscription.cancelled_at,
          })
          .eq('id', originalSubscription.id)
      }
    }
  })

  test('cancelled psychologist loses gated access and keeps subscription management visible', async ({ page }) => {
    test.setTimeout(180_000)

    const admin = createAdminSupabase()
    const userId = await findAuthUserIdByEmail('psicologo2@test.com')

    const { data: originalProfile, error: profileError } = await admin
      .from('profiles')
      .select('membership_level, subscription_status, membership_specialization_code')
      .eq('id', userId)
      .single()

    if (profileError || !originalProfile) {
      throw new Error(`Unable to load original profile for cancellation audit: ${profileError?.message ?? 'missing profile'}`)
    }

    const { data: originalSubscription, error: subscriptionError } = await admin
      .from('subscriptions')
      .select('id, status, cancel_at_period_end, current_period_end, cancelled_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      throw new Error(`Unable to load subscription snapshot for cancellation audit: ${subscriptionError.message}`)
    }

    try {
      const { error: updateProfileError } = await admin
        .from('profiles')
        .update({
          membership_level: 0,
          subscription_status: 'cancelled',
          membership_specialization_code: null,
        })
        .eq('id', userId)

      if (updateProfileError) {
        throw new Error(`Unable to set cancelled profile state: ${updateProfileError.message}`)
      }

      if (originalSubscription?.id) {
        const { error: updateSubscriptionError } = await admin
          .from('subscriptions')
          .update({
            status: 'expired',
            cancel_at_period_end: false,
            current_period_end: new Date().toISOString(),
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', originalSubscription.id)

        if (updateSubscriptionError) {
          throw new Error(`Unable to set cancelled subscription state: ${updateSubscriptionError.message}`)
        }
      }

      await signInAs(page, 'psicologo2@test.com')

      await page.goto('/dashboard/calendar', { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await page.waitForLoadState('networkidle').catch(() => null)
      expect(new URL(page.url()).pathname).toBe('/dashboard/subscription')

      await page.goto('/dashboard/subscription', { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await page.waitForLoadState('networkidle').catch(() => null)

      await expect(page.getByText('Gestionar suscripcion y facturacion')).toBeVisible()
    } finally {
      await admin
        .from('profiles')
        .update({
          membership_level: originalProfile.membership_level,
          subscription_status: originalProfile.subscription_status,
          membership_specialization_code: originalProfile.membership_specialization_code,
        })
        .eq('id', userId)

      if (originalSubscription?.id) {
        await admin
          .from('subscriptions')
          .update({
            status: originalSubscription.status,
            cancel_at_period_end: originalSubscription.cancel_at_period_end,
            current_period_end: originalSubscription.current_period_end,
            cancelled_at: originalSubscription.cancelled_at,
          })
          .eq('id', originalSubscription.id)
      }
    }
  })
})
