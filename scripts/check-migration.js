const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
    // Test if target_audience column already exists on resources
    const { data, error } = await supabase
        .from('resources')
        .select('id, target_audience, min_membership_level')
        .limit(1)

    if (error) {
        console.log('Column not found, migration needed:', error.message)
        console.log('')
        console.log('Please run the following SQL in Supabase Dashboard > SQL Editor:')
        console.log('File: supabase/migrations/018_resource_audience.sql')
    } else {
        console.log('Columns already exist! Data sample:', JSON.stringify(data, null, 2))
    }
}

run().catch(console.error)
