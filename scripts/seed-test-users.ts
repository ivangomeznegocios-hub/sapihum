import { createClient } from '@supabase/supabase-js'

// You must run this script with variables loaded, e.g., using dotenv
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const testUsers = [
    { email: 'psicologo0@test.com', level: 0 },
    { email: 'psicologo1@test.com', level: 1 },
    { email: 'psicologo2@test.com', level: 2 },
    { email: 'psicologo3@test.com', level: 3 },
]

async function seedUsers() {
    console.log('🌱 Starting test user seed process...')

    for (const u of testUsers) {
        console.log(`\nCreating ${u.email} (Nivel ${u.level})...`)

        // 1. Create user in auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: 'test1234',
            email_confirm: true,
            user_metadata: {
                full_name: `Psicologo Nivel ${u.level}`,
            }
        })

        if (authError) {
            console.error(`❌ Error creating auth user for ${u.email}:`, authError.message)
            continue
        }

        const userId = authData.user.id
        console.log(`✅ Auth user created: ${userId}`)

        // 2. The trigger creates the profile. Update it with role and membership level
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                role: 'psychologist',
                membership_level: u.level,
                full_name: `Psicologo Nivel ${u.level}`
            })
            .eq('id', userId)

        if (profileError) {
            console.error(`❌ Error updating profile for ${u.email}:`, profileError.message)
        } else {
            console.log(`✅ Profile updated for ${u.email} (Role: psychologist, Level: ${u.level})`)
        }
    }

    console.log('\n✨ Seeding completed!')
}

seedUsers()
