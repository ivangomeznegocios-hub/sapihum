import dotenv from 'dotenv'
import { expect, test, type Page } from '@playwright/test'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local', quiet: true })

const PASSWORD = 'test1234'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

type SampleKey =
  | 'eventId'
  | 'speakerId'
  | 'resourceId'
  | 'patientId'
  | 'publicEventId'
  | 'publicSpeakerId'
  | 'psychologist2PatientId'
  | 'psychologist3PatientId'
  | 'patientToolAssignmentId'
  | 'patientAppointmentId'

type RouteEntry =
  | string
  | {
      path: string
      requires: SampleKey
    }

type Samples = Partial<Record<SampleKey, string>>

function isTransientNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /fetch failed|getaddrinfo|enotfound|econnreset|etimedout|eai_again/i.test(message)
}

async function withRetry<T>(
  operationName: string,
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (!isTransientNetworkError(error) || attempt === attempts) {
        throw error
      }

      console.warn(
        `${operationName} failed on attempt ${attempt}/${attempts}. Retrying after transient network error.`
      )
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000))
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${operationName} failed after ${attempts} attempts.`)
}

const PUBLIC_DYNAMIC_ROUTES: RouteEntry[] = [
  { path: '/events/:publicEventId', requires: 'publicEventId' },
  { path: '/events/:publicEventId/embed', requires: 'publicEventId' },
  { path: '/speakers/:publicSpeakerId', requires: 'publicSpeakerId' },
]

const ROLE_AUDITS: Array<{
  name: string
  email: string
  routes: RouteEntry[]
}> = [
  {
    name: 'admin',
    email: 'admin@test.com',
    routes: [
      '/dashboard',
      '/dashboard/admin',
      '/dashboard/admin/users',
      '/dashboard/admin/directory',
      '/dashboard/admin/earnings',
      '/dashboard/admin/referrals',
      '/dashboard/admin/newsletters',
      '/dashboard/admin/agreements',
      '/dashboard/admin/growth',
      '/dashboard/admin/marketing',
      '/dashboard/admin/analytics',
      '/dashboard/calendar',
      '/dashboard/messages',
      '/dashboard/events',
      '/dashboard/events/new',
      '/dashboard/events/analytics',
      '/dashboard/events/business',
      '/dashboard/events/clinical',
      '/dashboard/events/networking',
      '/dashboard/events/recordings',
      { path: '/dashboard/events/:eventId', requires: 'eventId' },
      '/dashboard/speakers',
      { path: '/dashboard/speakers/:speakerId', requires: 'speakerId' },
      '/dashboard/resources',
      '/dashboard/resources/new',
      { path: '/dashboard/resources/:resourceId', requires: 'resourceId' },
      '/dashboard/newsletter',
      '/dashboard/agreements',
      '/dashboard/growth',
      '/dashboard/documents',
      '/dashboard/analytics',
      '/dashboard/marketing',
      '/dashboard/earnings',
      '/dashboard/subscription',
      '/dashboard/settings',
      { path: '/dashboard/admin/speakers/:speakerId/edit', requires: 'speakerId' },
    ],
  },
  {
    name: 'psychologist-level-1',
    email: 'psicologo1@test.com',
    routes: [
      '/dashboard',
      '/dashboard/events',
      '/dashboard/events/business',
      '/dashboard/events/clinical',
      '/dashboard/events/networking',
      '/dashboard/events/recordings',
      { path: '/dashboard/events/:eventId', requires: 'eventId' },
      '/dashboard/speakers',
      { path: '/dashboard/speakers/:speakerId', requires: 'speakerId' },
      '/dashboard/resources',
      '/dashboard/newsletter',
      '/dashboard/agreements',
      '/dashboard/growth',
      '/dashboard/settings',
      '/dashboard/subscription',
    ],
  },
  {
    name: 'psychologist-level-2',
    email: 'psicologo2@test.com',
    routes: [
      '/dashboard',
      '/dashboard/messages',
      '/dashboard/events',
      '/dashboard/events/business',
      '/dashboard/events/clinical',
      '/dashboard/events/networking',
      '/dashboard/events/recordings',
      { path: '/dashboard/events/:eventId', requires: 'eventId' },
      '/dashboard/speakers',
      { path: '/dashboard/speakers/:speakerId', requires: 'speakerId' },
      '/dashboard/resources',
      '/dashboard/newsletter',
      '/dashboard/agreements',
      '/dashboard/growth',
      '/dashboard/calendar',
      '/dashboard/patients',
      { path: '/dashboard/patients/:psychologist2PatientId', requires: 'psychologist2PatientId' },
      { path: '/dashboard/patients/:psychologist2PatientId/notes/new', requires: 'psychologist2PatientId' },
      '/dashboard/tasks',
      '/dashboard/documents',
      '/dashboard/referrals',
      '/dashboard/analytics',
      '/dashboard/settings',
      '/dashboard/subscription',
    ],
  },
  {
    name: 'psychologist-level-3',
    email: 'psicologo3@test.com',
    routes: [
      '/dashboard',
      '/dashboard/messages',
      '/dashboard/events',
      '/dashboard/events/business',
      '/dashboard/events/clinical',
      '/dashboard/events/networking',
      '/dashboard/events/recordings',
      { path: '/dashboard/events/:eventId', requires: 'eventId' },
      '/dashboard/speakers',
      { path: '/dashboard/speakers/:speakerId', requires: 'speakerId' },
      '/dashboard/resources',
      '/dashboard/newsletter',
      '/dashboard/agreements',
      '/dashboard/growth',
      '/dashboard/calendar',
      '/dashboard/patients',
      { path: '/dashboard/patients/:psychologist3PatientId', requires: 'psychologist3PatientId' },
      { path: '/dashboard/patients/:psychologist3PatientId/notes/new', requires: 'psychologist3PatientId' },
      '/dashboard/tasks',
      '/dashboard/documents',
      '/dashboard/referrals',
      '/dashboard/analytics',
      '/dashboard/marketing',
      '/dashboard/settings',
      '/dashboard/subscription',
    ],
  },
  {
    name: 'patient',
    email: 'paciente@test.com',
    routes: [
      '/dashboard',
      '/dashboard/calendar',
      '/dashboard/messages',
      '/dashboard/my-psychologist',
      '/dashboard/booking',
      '/dashboard/tasks',
      '/dashboard/tools',
      { path: '/dashboard/tools/:patientToolAssignmentId', requires: 'patientToolAssignmentId' },
      '/dashboard/documents',
      '/dashboard/events',
      { path: '/dashboard/events/:eventId', requires: 'eventId' },
      '/dashboard/settings',
      { path: '/dashboard/session/:patientAppointmentId', requires: 'patientAppointmentId' },
    ],
  },
  {
    name: 'ponente',
    email: 'ponente@test.com',
    routes: [
      '/dashboard',
      '/dashboard/growth',
      '/dashboard/events',
      '/dashboard/events/new',
      { path: '/dashboard/events/:eventId', requires: 'eventId' },
      '/dashboard/earnings',
      '/dashboard/settings',
      '/dashboard/speakers',
      { path: '/dashboard/speakers/:speakerId', requires: 'speakerId' },
      '/dashboard/resources',
      '/dashboard/newsletter',
      '/dashboard/agreements',
    ],
  },
]

let samples: Samples = {}

function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables for role audit.')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function createSessionSupabase(
  setCookies: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => void
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables for browser session audit.')
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
  return withRetry(`createSessionCookies:${email}`, async () => {
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
  })
}

async function resolveSamples(): Promise<Samples> {
  return withRetry('resolveSamples', async () => {
    const supabase = createAdminSupabase()
    const { data: usersResult, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    })

    if (usersError) {
      throw new Error(`Unable to list auth users for role audit: ${usersError.message}`)
    }

    const userIdByEmail = new Map(
      (usersResult.users ?? []).map((user) => [user.email, user.id] as const)
    )

    const psychologist2Id = userIdByEmail.get('psicologo2@test.com')
    const psychologist3Id = userIdByEmail.get('psicologo3@test.com')
    const patientId = userIdByEmail.get('paciente@test.com')

    const [
      eventResult,
      publicEventResult,
      speakerResult,
      publicSpeakerResult,
      resourceResult,
      relationshipResult,
      psychologist2RelationshipResult,
      psychologist3RelationshipResult,
      patientToolAssignmentResult,
      patientAppointmentResult,
    ] = await Promise.all([
      supabase
        .from('events')
        .select('id')
        .in('status', ['upcoming', 'live', 'completed'])
        .eq('is_members_only', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('events')
        .select('id')
        .not('status', 'eq', 'draft')
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('speakers')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('speakers')
        .select('id')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('resources')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('patient_psychologist_relationships')
        .select('patient_id')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle(),
      psychologist2Id
        ? supabase
            .from('patient_psychologist_relationships')
            .select('patient_id')
            .eq('psychologist_id', psychologist2Id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      psychologist3Id
        ? supabase
            .from('patient_psychologist_relationships')
            .select('patient_id')
            .eq('psychologist_id', psychologist3Id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      patientId
        ? supabase
            .from('tool_assignments')
            .select('id')
            .eq('patient_id', patientId)
            .order('assigned_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      patientId
        ? supabase
            .from('appointments')
            .select('id')
            .eq('patient_id', patientId)
            .order('start_time', { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    return {
      eventId: eventResult.data?.id ?? undefined,
      publicEventId: publicEventResult.data?.id ?? undefined,
      speakerId: speakerResult.data?.id ?? undefined,
      publicSpeakerId: publicSpeakerResult.data?.id ?? undefined,
      resourceId: resourceResult.data?.id ?? undefined,
      patientId: relationshipResult.data?.patient_id ?? undefined,
      psychologist2PatientId: psychologist2RelationshipResult.data?.patient_id ?? undefined,
      psychologist3PatientId: psychologist3RelationshipResult.data?.patient_id ?? undefined,
      patientToolAssignmentId: patientToolAssignmentResult.data?.id ?? undefined,
      patientAppointmentId: patientAppointmentResult.data?.id ?? undefined,
    }
  })
}

function materializeRoute(route: RouteEntry, sampleMap: Samples): string | null {
  if (typeof route === 'string') {
    return route
  }

  const value = sampleMap[route.requires]
  if (!value) {
    return null
  }

  return route.path.replace(`:${route.requires}`, value)
}

async function waitForStableLayout(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => null)

  await page.waitForFunction(
    () => {
      const hasNextStyles = Array.from(document.styleSheets).some((sheet) => {
        try {
          return Boolean(
            sheet.href?.includes('/_next/static/css') &&
              (sheet as CSSStyleSheet).cssRules.length > 0
          )
        } catch {
          return false
        }
      })

      if (!hasNextStyles) {
        return false
      }

      const header = document.querySelector('header')
      if (!header) {
        return true
      }

      return getComputedStyle(header).position === 'sticky'
    },
    undefined,
    { timeout: 15_000 }
  )
}

async function assertMobileHealthy(page: Page, route: string, roleName: string) {
  const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 })

  expect(response, `No response received for ${roleName} on ${route}`).not.toBeNull()
  expect(response?.status(), `${roleName} received an unexpected status on ${route}`).toBeLessThan(400)

  await waitForStableLayout(page)
  await expect(page.locator('body')).toBeVisible()
  expect(page.url(), `${roleName} was redirected to login on ${route}`).not.toContain('/auth/login')

  const bodyText = await page.locator('body').innerText()
  expect(bodyText, `${roleName} hit a runtime error on ${route}`).not.toMatch(
    /application error|something went wrong|unexpected error|next\.js/i
  )

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(
    overflow.scrollWidth,
    `Horizontal overflow detected for ${roleName} on ${route}`
  ).toBeLessThanOrEqual(overflow.clientWidth + 1)
}

test.beforeAll(async () => {
  samples = await resolveSamples()
})

test('mobile audit: public dynamic routes', async ({ page }) => {
  test.setTimeout(120_000)

  for (const route of PUBLIC_DYNAMIC_ROUTES) {
    const path = materializeRoute(route, samples)
    if (!path) {
      test.info().annotations.push({
        type: 'skip',
        description: `Missing sample for ${route.requires}, skipping ${route.path}`,
      })
      continue
    }

    await assertMobileHealthy(page, path, 'public')
  }
})

for (const audit of ROLE_AUDITS) {
  test(`mobile audit: ${audit.name}`, async ({ page }) => {
    test.setTimeout(300_000)
    page.setDefaultNavigationTimeout(60_000)
    page.setDefaultTimeout(60_000)

    const pageErrors: string[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    await page.context().clearCookies()
    await page.context().addCookies(await createSessionCookies(audit.email))
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForStableLayout(page)

    for (const route of audit.routes) {
      const path = materializeRoute(route, samples)

      if (!path) {
        if (typeof route !== 'string') {
          test.info().annotations.push({
            type: 'skip',
            description: `Missing sample for ${route.requires}, skipping ${route.path}`,
          })
        }
        continue
      }

      await test.step(path, async () => {
        await assertMobileHealthy(page, path, audit.name)
      })
    }

    expect(pageErrors, `Browser runtime errors detected for ${audit.name}`).toEqual([])
  })
}
