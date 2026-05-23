import { expect, test } from '@playwright/test'
import { getEventsWithRegistration } from '../src/lib/supabase/queries/events'

function createFailingEventsSupabase(message = 'schema cache miss') {
  const failingQuery = {
    select: () => failingQuery,
    in: () => failingQuery,
    order: () => failingQuery,
    limit: () => failingQuery,
    then: (resolve: (value: unknown) => void) => resolve({
      data: null,
      error: {
        message,
        code: 'PGRST204',
      },
    }),
  }

  return {
    from: () => failingQuery,
  }
}

test.describe('event query errors', () => {
  test('strict event list loading throws a controlled error', async () => {
    await expect(getEventsWithRegistration({
      supabase: createFailingEventsSupabase(),
      userId: 'user-1',
      activeVerticalId: null,
      profile: {
        id: 'user-1',
        email: 'test@example.com',
        role: 'psychologist',
        membership_level: 0,
        subscription_status: 'inactive',
        membership_specialization_code: null,
      },
      commercialAccess: null,
      throwOnError: true,
    })).rejects.toThrow('EVENTS_LIST_LOAD_FAILED')
  })

  test('non-strict event list loading keeps legacy empty-array fallback', async () => {
    await expect(getEventsWithRegistration({
      supabase: createFailingEventsSupabase(),
      userId: 'user-1',
      activeVerticalId: null,
      profile: null,
      commercialAccess: null,
    })).resolves.toEqual([])
  })
})
