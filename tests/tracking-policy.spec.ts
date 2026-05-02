import { expect, test } from '@playwright/test'
import {
  buildGoogleConsentModeState,
  CONSENT_CHANGE_EVENT,
  CONSENT_COOKIE_NAME,
  createStoredConsentState,
  parseConsentCookie,
  setConsentState,
} from '../src/lib/consent'
import {
  getAllowedTrackingDestinations,
  getCanonicalTrackingEventName,
  getConsentAllowedTrackingDestinations,
} from '../src/lib/tracking/catalog'
import { resolveTrackingRouteContext } from '../src/lib/tracking/policy'
import { sanitizeTrackingProperties } from '../src/lib/tracking/sanitize'

test.describe('tracking policy', () => {
  test('classifies public, restricted, private, and sensitive routes correctly', () => {
    expect(resolveTrackingRouteContext('/').zone).toBe('public_safe')
    expect(resolveTrackingRouteContext('/eventos/mi-evento').zone).toBe('public_safe')
    expect(resolveTrackingRouteContext('/auth/login').zone).toBe('public_restricted')
    expect(resolveTrackingRouteContext('/hub/mi-evento').zone).toBe('public_restricted')
    expect(resolveTrackingRouteContext('/dashboard').zone).toBe('private_app')
    expect(resolveTrackingRouteContext('/dashboard/patients/123').zone).toBe('sensitive')
  })

  test('only public safe routes allow third-party destinations', () => {
    const publicContext = resolveTrackingRouteContext('/precios')
    const restrictedContext = resolveTrackingRouteContext('/auth/login')
    const privateContext = resolveTrackingRouteContext('/dashboard')

    expect(getAllowedTrackingDestinations('waitlist_joined', publicContext)).toEqual([
      'first_party_analytics',
      'gtm',
      'ga4',
      'meta_pixel',
      'meta_capi',
      'tiktok_pixel',
      'tiktok_events_api',
    ])

    expect(getAllowedTrackingDestinations('checkout_started', restrictedContext)).toEqual([])
    expect(getAllowedTrackingDestinations('checkout_started', privateContext)).toEqual(['first_party_analytics'])
  })

  test('sensitive routes keep appointment tracking first-party only', () => {
    const sensitiveContext = resolveTrackingRouteContext('/dashboard/booking')
    expect(getAllowedTrackingDestinations('book_appointment', sensitiveContext)).toEqual(['first_party_analytics'])
    expect(sensitiveContext.allowAutoPageView).toBe(false)
    expect(sensitiveContext.allowAutoClickTracking).toBe(false)
  })

  test('maps legacy internal events to canonical public event names', () => {
    expect(getCanonicalTrackingEventName('checkout_started')).toBe('begin_checkout')
    expect(getCanonicalTrackingEventName('waitlist_joined')).toBe('generate_lead')
    expect(getCanonicalTrackingEventName('registration_completed')).toBe('sign_up')
    expect(getCanonicalTrackingEventName('payment_completed')).toBe('purchase')
  })

  test('sanitizes PII and strips query strings from tracked properties', () => {
    expect(
      sanitizeTrackingProperties({
        email: 'persona@ejemplo.com',
        href: 'https://sapihum.com/eventos/clinica?email=secret',
        nested: {
          phone: '+5215512345678',
          path: '/compras/exito?session=123',
          amount: 1200,
        },
      })
    ).toEqual({
      href: '/eventos/clinica',
      nested: {
        path: '/compras/exito',
        amount: 1200,
      },
    })
  })

  test('builds strict consent mode defaults and granted states', () => {
    expect(buildGoogleConsentModeState(null)).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
    })

    const grantedState = createStoredConsentState({
      analytics: true,
      marketing: true,
    })

    expect(buildGoogleConsentModeState(grantedState)).toMatchObject({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    })
  })

  test('normalizes legacy Cookiebot consent cookies to the owned banner source', () => {
    const legacyCookie = encodeURIComponent(JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false,
      acceptedAt: '2026-03-18T00:00:00.000Z',
      version: '2026-03-18',
      source: 'cookiebot',
    }))

    expect(parseConsentCookie(legacyCookie)).toMatchObject({
      necessary: true,
      analytics: true,
      marketing: false,
      source: 'cookie-banner',
    })
  })

  test('persists browser consent and updates Google Consent Mode', () => {
    let cookieValue = ''
    const storage = new Map<string, string>()
    const gtagCalls: unknown[][] = []
    const dispatchedEvents: string[] = []

    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        get cookie() {
          return cookieValue
        },
        set cookie(value: string) {
          cookieValue = value
        },
      },
    })

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    })

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        gtag: (...args: unknown[]) => gtagCalls.push(args),
        dispatchEvent: (event: Event) => {
          dispatchedEvents.push(event.type)
          return true
        },
      },
    })

    const state = setConsentState({
      analytics: true,
      marketing: true,
      acceptedAt: '2026-03-18T00:00:00.000Z',
      source: 'consent-center',
    })

    expect(cookieValue).toContain(`${CONSENT_COOKIE_NAME}=`)
    expect(storage.get(CONSENT_COOKIE_NAME)).toContain('"source":"consent-center"')
    expect(gtagCalls).toContainEqual([
      'consent',
      'update',
      expect.objectContaining({
        analytics_storage: 'granted',
        ad_storage: 'granted',
      }),
    ])
    expect(dispatchedEvents).toContain(CONSENT_CHANGE_EVENT)
    expect(state.source).toBe('consent-center')

    Reflect.deleteProperty(globalThis, 'document')
    Reflect.deleteProperty(globalThis, 'localStorage')
    Reflect.deleteProperty(globalThis, 'window')
  })

  test('filters destination registry by consent category', () => {
    const publicContext = resolveTrackingRouteContext('/precios')
    const noConsent = getConsentAllowedTrackingDestinations('waitlist_joined', publicContext, null)
    const analyticsOnly = getConsentAllowedTrackingDestinations(
      'waitlist_joined',
      publicContext,
      createStoredConsentState({ analytics: true, marketing: false })
    )
    const marketingOnly = getConsentAllowedTrackingDestinations(
      'waitlist_joined',
      publicContext,
      createStoredConsentState({ analytics: false, marketing: true })
    )

    expect(noConsent).toEqual([])
    expect(analyticsOnly).toEqual(['first_party_analytics', 'gtm', 'ga4'])
    expect(marketingOnly).toEqual([
      'first_party_analytics',
      'gtm',
      'meta_pixel',
      'meta_capi',
      'tiktok_pixel',
      'tiktok_events_api',
    ])
  })
})
