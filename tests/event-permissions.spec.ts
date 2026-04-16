import { expect, test } from '@playwright/test'
import { resolveEventEditorAccess } from '../src/lib/events/permissions'

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
