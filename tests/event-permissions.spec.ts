import { expect, test } from '@playwright/test'
import {
  canCreateEvent,
  canDeleteEvent,
  canPublishEvent,
  canViewEventStats,
  resolveEventEditorAccess,
} from '../src/lib/events/permissions'

test.describe('event permissions', () => {
  test('admin can manage and edit any event', () => {
    expect(
      resolveEventEditorAccess({
        userId: 'admin-1',
        role: 'admin',
        createdBy: 'someone-else',
      })
    ).toEqual({
      canManageEvent: true,
      canEditEvent: true,
      isAssignedSpeaker: false,
    })
  })

  test('event manager can manage and edit any event', () => {
    expect(
      resolveEventEditorAccess({
        userId: 'manager-1',
        role: 'event_manager',
        createdBy: 'someone-else',
      })
    ).toEqual({
      canManageEvent: true,
      canEditEvent: true,
      isAssignedSpeaker: false,
    })
  })

  test('event manager can create and publish but cannot delete or view stats', () => {
    expect(canCreateEvent('event_manager')).toBe(true)
    expect(canPublishEvent('event_manager')).toBe(true)
    expect(canDeleteEvent('event_manager')).toBe(false)
    expect(canViewEventStats('event_manager')).toBe(false)
  })

  test('admin keeps full event privileges', () => {
    expect(canCreateEvent('admin')).toBe(true)
    expect(canPublishEvent('admin')).toBe(true)
    expect(canDeleteEvent('admin')).toBe(true)
    expect(canViewEventStats('admin')).toBe(true)
  })

  test('ponente can create but cannot publish, delete, or view stats', () => {
    expect(canCreateEvent('ponente')).toBe(true)
    expect(canPublishEvent('ponente')).toBe(false)
    expect(canDeleteEvent('ponente')).toBe(false)
    expect(canViewEventStats('ponente')).toBe(false)
  })

  test('creator can manage and edit own event', () => {
    expect(
      resolveEventEditorAccess({
        userId: 'speaker-1',
        role: 'ponente',
        createdBy: 'speaker-1',
      })
    ).toEqual({
      canManageEvent: true,
      canEditEvent: true,
      isAssignedSpeaker: false,
    })
  })

  test('assigned speaker can edit without manage permissions', () => {
    expect(
      resolveEventEditorAccess({
        userId: 'speaker-2',
        role: 'ponente',
        createdBy: 'admin-1',
        isAssignedSpeaker: true,
      })
    ).toEqual({
      canManageEvent: false,
      canEditEvent: true,
      isAssignedSpeaker: true,
    })
  })

  test('unrelated speaker cannot edit the event', () => {
    expect(
      resolveEventEditorAccess({
        userId: 'speaker-3',
        role: 'ponente',
        createdBy: 'admin-1',
      })
    ).toEqual({
      canManageEvent: false,
      canEditEvent: false,
      isAssignedSpeaker: false,
    })
  })
})
