import { expect, test } from '@playwright/test'
import { canViewerReachEventOffer, canViewerSeeCatalogEvent, viewerMatchesAudience } from '../src/lib/access/catalog'
import { audienceAllowsAccess } from '../src/lib/access/commercial'
import type { TargetAudience } from '../src/types/database'

const psychologistLevel0Viewer = {
  profile: {
    id: 'psychologist-0',
    email: 'psicologo0@test.com',
    role: 'psychologist' as const,
    membership_level: 0,
    subscription_status: 'inactive' as const,
    membership_specialization_code: null,
  },
  subscription: null,
  membershipActive: false,
  membershipLevel: 0,
  membershipSpecializationCode: null,
  hasActivePatientRelationship: false,
}

const psychologistLevel0CommercialAccess = {
  ...psychologistLevel0Viewer,
  userId: psychologistLevel0Viewer.profile.id,
  role: psychologistLevel0Viewer.profile.role,
  email: psychologistLevel0Viewer.profile.email,
  hasActiveMembership: false,
  membershipSource: null,
  viewer: psychologistLevel0Viewer,
}

test.describe('event catalog visibility', () => {
  test('level 0 psychologists can discover published member events but cannot access the offer', () => {
    const event = {
      status: 'upcoming' as const,
      target_audience: ['members'] as TargetAudience[],
      created_by: 'someone-else',
    }

    expect(canViewerSeeCatalogEvent(event, psychologistLevel0Viewer)).toBe(true)
    expect(audienceAllowsAccess(event.target_audience, psychologistLevel0CommercialAccess)).toBe(false)
  })

  test('level 0 psychologists can register only for public audience content', () => {
    expect(viewerMatchesAudience(['public'], psychologistLevel0Viewer)).toBe(true)
    expect(viewerMatchesAudience(['members'], psychologistLevel0Viewer)).toBe(false)
  })

  test('professional-only events stay visible but locked for level 0 psychologists', () => {
    const event = {
      status: 'upcoming' as const,
      target_audience: ['psychologists', 'members'] as TargetAudience[],
      created_by: 'someone-else',
      recording_url: null,
      recording_expires_at: null,
      event_type: 'live' as const,
    }

    expect(canViewerSeeCatalogEvent(event, psychologistLevel0Viewer)).toBe(true)
    expect(canViewerReachEventOffer(event, psychologistLevel0Viewer)).toBe(false)
  })
})
