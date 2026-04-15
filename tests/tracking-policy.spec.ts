import { expect, test } from '@playwright/test'
import { buildGoogleConsentModeState, createStoredConsentState } from '../src/lib/consent'
import { getAllowedTrackingDestinations, getCanonicalTrackingEventName } from '../src/lib/tracking/catalog'
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
})
