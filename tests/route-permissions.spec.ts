import dotenv from 'dotenv'
import { expect, test, type Page } from '@playwright/test'
import { createServerClient } from '@supabase/ssr'

dotenv.config({ path: '.env.local', quiet: true })

const PASSWORD = 'test1234'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

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

test.describe('server route permissions', () => {
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
})
