import { expect, test } from '@playwright/test'
import { resolveEventDetailState } from '../src/lib/events/detail-state'

test.describe('event detail state', () => {
  test('missing vertical access renders a restricted event state', () => {
    expect(resolveEventDetailState({
      canEditEvent: false,
      canUseActiveVertical: false,
      canDiscoverEvent: true,
      isRegistered: false,
      hasAccessEntitlement: false,
    })).toBe('restricted')
  })

  test('registered users can view the event detail even when catalog discovery is false', () => {
    expect(resolveEventDetailState({
      canEditEvent: false,
      canUseActiveVertical: true,
      canDiscoverEvent: false,
      isRegistered: true,
      hasAccessEntitlement: false,
    })).toBe('available')
  })

  test('users without discovery, registration, or entitlement get restricted copy', () => {
    expect(resolveEventDetailState({
      canEditEvent: false,
      canUseActiveVertical: true,
      canDiscoverEvent: false,
      isRegistered: false,
      hasAccessEntitlement: false,
    })).toBe('restricted')
  })
})
