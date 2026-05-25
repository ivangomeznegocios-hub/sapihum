import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const TEST_USER_PASSWORD = 'test12345'

type TestUserRole = 'admin' | 'support' | 'event_manager' | 'psychologist' | 'patient' | 'ponente'

interface TestUserSeed {
    email: string
    role: TestUserRole
    fullName: string
    membershipLevel: number
    membershipSpecializationCode?: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

const testUsers: TestUserSeed[] = [
    { email: 'admin@test.com', role: 'admin', fullName: 'Admin Test', membershipLevel: 3 },
    { email: 'support@test.com', role: 'support', fullName: 'Support Test', membershipLevel: 0 },
    { email: 'event_manager@test.com', role: 'event_manager', fullName: 'Event Manager Test', membershipLevel: 0 },
    { email: 'psicologo0@test.com', role: 'psychologist', fullName: 'Psicologo Nivel 0', membershipLevel: 0 },
    { email: 'psicologo1@test.com', role: 'psychologist', fullName: 'Psicologo Nivel 1', membershipLevel: 1 },
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
    { email: 'paciente@test.com', role: 'patient', fullName: 'Paciente Test', membershipLevel: 0 },
    { email: 'ponente@test.com', role: 'ponente', fullName: 'Ponente Test', membershipLevel: 0 },
]

async function findAuthUserByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase()

    for (let page = 1; page <= 10; page += 1) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
        if (error) {
            throw new Error(`Unable to list auth users: ${error.message}`)
        }

        const match = (data?.users ?? []).find((entry) => entry.email?.trim().toLowerCase() === normalizedEmail)
        if (match) return match

        if ((data?.users ?? []).length < 200) break
    }

    return null
}

async function ensureAuthUser(user: TestUserSeed) {
    const existingUser = await findAuthUserByEmail(user.email)

    if (existingUser) {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: TEST_USER_PASSWORD,
            email_confirm: true,
            user_metadata: {
                full_name: user.fullName,
            },
        })

        if (error || !data.user) {
            throw new Error(`Unable to update auth user for ${user.email}: ${error?.message ?? 'missing user'}`)
        }

        return data.user.id
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
        user_metadata: {
            full_name: user.fullName,
        },
    })

    if (error || !data.user) {
        throw new Error(`Unable to create auth user for ${user.email}: ${error?.message ?? 'missing user'}`)
    }

    return data.user.id
}

async function seedUsers() {
    console.log('Starting test user seed process...')
    console.log(`Password for all test users: ${TEST_USER_PASSWORD}`)

    for (const user of testUsers) {
        console.log(`\nUpserting ${user.email} (${user.role}, Nivel ${user.membershipLevel})...`)
        const userId = await ensureAuthUser(user)

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email: user.email,
                role: user.role,
                membership_level: user.membershipLevel,
                membership_specialization_code: user.membershipSpecializationCode ?? null,
                subscription_status: user.membershipLevel > 0 ? 'active' : 'inactive',
                full_name: user.fullName,
                is_test: true,
            }, { onConflict: 'id' })

        if (profileError) {
            throw new Error(`Unable to upsert profile for ${user.email}: ${profileError.message}`)
        }

        console.log(`Saved ${user.email}`)
    }

    console.log('\nSeeding completed.')
}

seedUsers().catch((error) => {
    console.error(error)
    process.exit(1)
})
