import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const PUBLIC_ROUTES = [
  { path: '/', label: 'home' },
  { path: '/lp', label: 'landing' },
  { path: '/comunidad', label: 'comunidad' },
  { path: '/nosotros', label: 'nosotros' },
  { path: '/manifiesto', label: 'manifiesto' },
  { path: '/blog', label: 'blog' },
  { path: '/recursos', label: 'recursos' },
  { path: '/especialidades', label: 'especialidades' },
  { path: '/especialidades/psicologia-clinica', label: 'especialidad clinica' },
  { path: '/especialidades/psicologia-infantil', label: 'especialidad infantil' },
  { path: '/especialidades/psicologia-forense', label: 'especialidad forense' },
  { path: '/especialidades/adulto-mayor', label: 'especialidad adulto mayor' },
  { path: '/aviso-privacidad', label: 'aviso de privacidad' },
  { path: '/terminos', label: 'terminos' },
  { path: '/auth/login', label: 'login' },
  { path: '/auth/register', label: 'registro' },
  { path: '/auth/forgot-password', label: 'recuperacion de contrasena' },
] as const

const ROLE_ROUTES = [
  {
    role: 'admin',
    routes: ['/dashboard', '/dashboard/admin', '/dashboard/admin/users', '/dashboard/admin/analytics'],
  },
  {
    role: 'psychologist',
    routes: ['/dashboard', '/dashboard/patients', '/dashboard/calendar', '/dashboard/analytics', '/dashboard/settings'],
  },
  {
    role: 'patient',
    routes: ['/dashboard', '/dashboard/my-psychologist', '/dashboard/booking', '/dashboard/tasks'],
  },
  {
    role: 'ponente',
    routes: ['/dashboard', '/dashboard/events', '/dashboard/earnings', '/dashboard/settings'],
  },
] as const

function resolveStorageState(role: string): string | null {
  const authDir = process.env.PLAYWRIGHT_STORAGE_STATE_DIR ?? path.join(process.cwd(), 'tests', '.auth')
  const candidate = path.join(authDir, `${role}.json`)
  return fs.existsSync(candidate) ? candidate : null
}

async function assertMobileHealthy(page: Page) {
  await expect(page.locator('body')).toBeVisible()

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/application error|something went wrong|unexpected error|next\.js/i)

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  expect(
    overflow.scrollWidth,
    `Horizontal overflow detected on ${page.url()}`
  ).toBeLessThanOrEqual(overflow.clientWidth + 1)
}

for (const route of PUBLIC_ROUTES) {
  test(`mobile smoke: ${route.label}`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })

    expect(response, `No response received for ${route.path}`).not.toBeNull()
    expect(response?.status(), `${route.path} returned an unexpected status`).toBeLessThan(400)

    await assertMobileHealthy(page)
  })
}

for (const { role, routes } of ROLE_ROUTES) {
  test.describe(`role smoke: ${role}`, () => {
    const storageState = resolveStorageState(role)

    if (!storageState) {
      test.skip(true, `Missing storage state for ${role}. Add tests/.auth/${role}.json or set PLAYWRIGHT_STORAGE_STATE_DIR.`)
      return
    }

    test.use({ storageState })

    for (const route of routes) {
      test(`mobile route: ${route}`, async ({ page }) => {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

        expect(response, `No response received for ${route}`).not.toBeNull()
        expect(response?.status(), `${route} returned an unexpected status`).toBeLessThan(400)

        await assertMobileHealthy(page)
      })
    }
  })
}
