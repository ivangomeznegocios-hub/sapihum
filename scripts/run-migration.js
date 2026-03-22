const https = require('https')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0]

const sql = fs.readFileSync('supabase/migrations/018_resource_audience.sql', 'utf8')

const postData = JSON.stringify({ query: sql })

const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/`)

// Use the SQL endpoint via PostgREST function
// Since we can't run raw SQL via REST, let's use pg_net or a different approach
// Alternative: use the supabase-js to call individual statements

const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    db: { schema: 'public' }
})

async function runMigration() {
    try {
        // Try to add columns by inserting with the new fields and seeing if it works
        // If columns don't exist, we need to run the SQL in Supabase dashboard

        // First, check if we can use the database functions
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: sql
        })

        if (error) {
            console.log('Cannot run SQL via RPC (exec_sql function not available)')
            console.log('')
            console.log('=== MANUAL STEP REQUIRED ===')
            console.log('Please run this SQL in Supabase Dashboard > SQL Editor:')
            console.log('')
            console.log(sql)
            process.exit(1)
        }

        console.log('Migration applied successfully!')
    } catch (err) {
        console.error('Error:', err.message)
    }
}

runMigration()
