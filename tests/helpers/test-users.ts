import { createClient } from '@supabase/supabase-js'

export const TEST_USER_PASSWORD = 'test12345'

type TestUserRole = 'admin' | 'support' | 'event_manager' | 'psychologist' | 'patient' | 'ponente'

interface TestUserConfig {
  email: string
  role: TestUserRole
  fullName: string
  membershipLevel?: number
  membershipSpecializationCode?: string | null
}

export const CORE_TEST_USERS: TestUserConfig[] = [
  {
    email: 'admin@test.com',
    role: 'admin',
    fullName: 'Admin Test',
    membershipLevel: 3,
  },
  {
    email: 'support@test.com',
    role: 'support',
    fullName: 'Support Test',
  },
  {
    email: 'event_manager@test.com',
    role: 'event_manager',
    fullName: 'Event Manager Test',
  },
  {
    email: 'psicologo0@test.com',
    role: 'psychologist',
    fullName: 'Psicologo Nivel 0',
  },
  {
    email: 'psicologo1@test.com',
    role: 'psychologist',
    fullName: 'Psicologo Nivel 1',
    membershipLevel: 1,
  },
  {
    email: 'psicologo2@test.com',
    role: 'psychologist',
    fullName: 'Psicologo Nivel 2',
    membershipLevel: 2,
    membershipSpecializationCode: 'clinica',
  },
  {
    email: 'psicologo3@test.com',
    role: 'psychologist',
    fullName: 'Psicologo Nivel 3',
    membershipLevel: 3,
    membershipSpecializationCode: 'clinica',
  },
  {
    email: 'paciente@test.com',
    role: 'patient',
    fullName: 'Paciente Test',
  },
  {
    email: 'ponente@test.com',
    role: 'ponente',
    fullName: 'Ponente Test',
  },
]

function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials for test user setup.')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminSupabase()
  const normalizedEmail = email.trim().toLowerCase()

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) {
      throw new Error(`Unable to list auth users: ${error.message}`)
    }

    const match = (data?.users ?? []).find((entry) => entry.email?.trim().toLowerCase() === normalizedEmail)
    if (match) return match

    if ((data?.users ?? []).length < 200) break
  }

  return null
}

async function canSignInWithTestPassword(email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return false

  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: TEST_USER_PASSWORD,
  })

  if (!error) {
    await supabase.auth.signOut()
  }

  return !error
}

async function ensureAuthUser(config: TestUserConfig) {
  const admin = createAdminSupabase()
  const existingUser = await findAuthUserByEmail(config.email)

  if (existingUser) {
    const canSignIn = await canSignInWithTestPassword(config.email)
    if (canSignIn) {
      return existingUser.id
    }

    const { data, error } = await admin.auth.admin.updateUserById(existingUser.id, {
      password: TEST_USER_PASSWORD,
      user_metadata: {
        full_name: config.fullName,
      },
    })

    if (error || !data.user) {
      throw new Error(`Unable to update auth user for ${config.email}: ${error?.message ?? 'missing user'}`)
    }

    return data.user.id
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: config.email,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: config.fullName,
    },
  })

  if (error || !data.user) {
    throw new Error(`Unable to create auth user for ${config.email}: ${error?.message ?? 'missing user'}`)
  }

  return data.user.id
}

function getVerticalRole(role: TestUserRole) {
  if (role === 'admin') return 'admin'
  if (role === 'support') return 'support'
  if (role === 'ponente') return 'instructor'
  return 'member'
}

export async function prepareRoleTestUser(config: TestUserConfig) {
  const admin = createAdminSupabase()
  const userId = await ensureAuthUser(config)
  const membershipLevel = config.membershipLevel ?? 0

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: userId,
      email: config.email,
      role: config.role,
      full_name: config.fullName,
      membership_level: membershipLevel,
      membership_specialization_code: config.membershipSpecializationCode ?? null,
      subscription_status: membershipLevel > 0 ? 'active' : 'inactive',
      is_test: true,
    }, { onConflict: 'id' })

  if (profileError) {
    throw new Error(`Unable to prepare profile for ${config.email}: ${profileError.message}`)
  }

  const { data: vertical, error: verticalError } = await admin
    .from('verticals')
    .select('id')
    .eq('code', 'psicologia')
    .single()

  if (verticalError || !vertical) {
    throw new Error(`Unable to load Psicologia vertical for ${config.email}: ${verticalError?.message ?? 'missing vertical'}`)
  }

  await admin
    .from('user_vertical_access')
    .update({ is_default: false })
    .eq('user_id', userId)

  const { error: accessError } = await admin
    .from('user_vertical_access')
    .upsert({
      user_id: userId,
      vertical_id: vertical.id,
      vertical_role: getVerticalRole(config.role),
      access_status: 'active',
      membership_level: membershipLevel,
      is_default: true,
    }, { onConflict: 'user_id,vertical_id' })

  if (accessError) {
    throw new Error(`Unable to prepare vertical access for ${config.email}: ${accessError.message}`)
  }

  if (config.role === 'ponente') {
    const { error: speakerError } = await admin
      .from('speakers')
      .upsert({
        id: userId,
        headline: 'Ponente Test',
        bio: 'Perfil de prueba para auditorías móviles.',
        photo_url: 'https://res.cloudinary.com/dguo9gbxd/image/upload/v1776127415/1280x720_2_cdtfzh.png',
        credentials: ['Perfil de prueba'],
        formations: ['Formación de prueba'],
        specialties: ['Psicología clínica'],
        social_links: {},
        social_links_enabled: false,
        is_public: true,
        commission_rate: 0,
      }, { onConflict: 'id' })

    if (speakerError) {
      throw new Error(`Unable to prepare speaker profile for ${config.email}: ${speakerError.message}`)
    }
  }

  return userId
}

export async function prepareCoreRoleTestUsers() {
  for (const user of CORE_TEST_USERS) {
    await prepareRoleTestUser(user)
  }
}
