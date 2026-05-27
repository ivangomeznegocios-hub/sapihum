import { expect, test } from '@playwright/test'
import {
  canCreateEvent,
  canDeleteEvent,
  canPublishEvent,
  canViewEventStats,
  resolveEventEditorAccess,
} from '../src/lib/events/permissions'
import { mergeEventAttendeeAccessRows } from '../src/lib/events/attendees'

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

  test('attendee access list deduplicates registrations and paid entitlements', () => {
    const attendees = mergeEventAttendeeAccessRows({
      registrations: [
        {
          id: 'registration-1',
          user_id: 'user-1',
          registration_data: { Especialidad: 'Clinica' },
          registered_at: '2026-05-27T10:00:00.000Z',
        },
      ],
      entitlements: [
        {
          id: 'entitlement-1',
          user_id: 'user-1',
          email: 'persona@example.com',
          identity_key: 'persona@example.com',
          access_kind: 'live_access',
          source_type: 'registration',
          created_at: '2026-05-27T10:01:00.000Z',
        },
        {
          id: 'entitlement-2',
          user_id: null,
          email: 'comprador@example.com',
          identity_key: 'comprador@example.com',
          access_kind: 'live_access',
          source_type: 'purchase',
          created_at: '2026-05-27T11:00:00.000Z',
        },
      ],
      profiles: [
        {
          id: 'user-1',
          full_name: 'Persona Registrada',
          avatar_url: null,
          email: 'persona@example.com',
        },
      ],
    })

    expect(attendees).toHaveLength(2)
    expect(attendees.find((attendee) => attendee.userId === 'user-1')).toMatchObject({
      displayName: 'Persona Registrada',
      accessSources: ['registration'],
      registrationData: { Especialidad: 'Clinica' },
    })
    expect(attendees.find((attendee) => attendee.email === 'comprador@example.com')).toMatchObject({
      displayName: 'comprador@example.com',
      accessSources: ['purchase'],
    })
  })
})
