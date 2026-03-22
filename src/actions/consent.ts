'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
    buildAiProcessingConsentRecord,
    buildCookieConsentRecords,
    buildRegistrationConsentRecords,
    type ConsentRecordPayload,
    type StoredConsentState,
} from '@/lib/consent'

type ConsentWriteResult = {
    success: boolean
    inserted?: number
    skipped?: boolean
    error?: string
}

async function getRequestContext() {
    const headerList = await headers()
    const userAgent = headerList.get('user-agent') || null
    const forwardedFor = headerList.get('x-forwarded-for') || headerList.get('x-real-ip')
    const ipAddress = forwardedFor
        ? forwardedFor.split(',')[0].trim()
        : null

    return { userAgent, ipAddress }
}

async function insertConsentRecords(
    records: ConsentRecordPayload[],
    options: { requireAuthenticated?: boolean } = {}
): Promise<ConsentWriteResult> {
    if (records.length === 0) {
        return { success: true, skipped: true, inserted: 0 }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        if (options.requireAuthenticated) {
            return { success: false, error: 'No autenticado' }
        }
        return { success: true, skipped: true, inserted: 0 }
    }

    const { userAgent, ipAddress } = await getRequestContext()
    let inserted = 0

    for (const record of records) {
        const { data: existing } = await (supabase
            .from('consent_records') as any)
            .select('id')
            .eq('user_id', user.id)
            .eq('consent_type', record.consent_type)
            .eq('version', record.version)
            .eq('granted', record.granted)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (existing) {
            continue
        }

        const { error } = await (supabase
            .from('consent_records') as any)
            .insert({
                user_id: user.id,
                consent_type: record.consent_type,
                version: record.version,
                granted: record.granted,
                ip_address: ipAddress,
                user_agent: userAgent,
                granted_at: record.granted_at ?? new Date().toISOString(),
                revoked_at: record.revoked_at ?? null,
            })

        if (error) {
            return { success: false, inserted, error: error.message }
        }

        inserted += 1
    }

    return { success: true, inserted }
}

export async function recordCookieConsent(state: StoredConsentState): Promise<ConsentWriteResult> {
    return insertConsentRecords(buildCookieConsentRecords(state))
}

export async function recordRegistrationConsents(
    metadata: Record<string, unknown> | null | undefined
): Promise<ConsentWriteResult> {
    return insertConsentRecords(buildRegistrationConsentRecords(metadata))
}

export async function recordAiProcessingConsent(
    acceptedAt = new Date().toISOString()
): Promise<ConsentWriteResult> {
    return insertConsentRecords([buildAiProcessingConsentRecord(acceptedAt)], { requireAuthenticated: true })
}
