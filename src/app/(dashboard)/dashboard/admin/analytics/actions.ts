'use server'

import { revalidatePath } from 'next/cache'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
import type { ManualDeal, MarketingCostEntry } from '@/lib/analytics/types'
import { createClient } from '@/lib/supabase/server'

async function assertAdmin() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { supabase, user: null, error: 'No autenticado' }
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as any)?.role !== 'admin') {
        return { supabase, user: null, error: 'Solo administradores' }
    }

    return { supabase, user, error: null as string | null }
}

export async function createMarketingCostEntry(input: MarketingCostEntry): Promise<{ success: boolean; error?: string }> {
    const { supabase, user, error } = await assertAdmin()
    if (error || !user) return { success: false, error: error ?? 'No autenticado' }

    const { error: insertError } = await (supabase as any).from('marketing_cost_entries').insert({
        period_start: input.periodStart,
        period_end: input.periodEnd,
        channel: input.channel,
        campaign: input.campaign || null,
        cost_type: input.costType,
        owner: input.owner || null,
        amount: input.amount,
        notes: input.notes || null,
        metadata: input.metadata || {},
        created_by: user.id,
    })

    if (insertError) {
        console.error('Error creating marketing cost entry:', insertError)
        return { success: false, error: 'No se pudo guardar el costo' }
    }

    await recordAnalyticsServerEvent({
        eventName: 'marketing_cost_recorded',
        eventSource: 'server',
        userId: user.id,
        touch: { funnel: 'admin_growth' },
        properties: {
            channel: input.channel,
            campaign: input.campaign || null,
            amount: input.amount,
            costType: input.costType,
        },
    })

    revalidatePath('/dashboard/admin/analytics')
    return { success: true }
}

export async function createManualDeal(input: ManualDeal): Promise<{ success: boolean; error?: string }> {
    const { supabase, user, error } = await assertAdmin()
    if (error || !user) return { success: false, error: error ?? 'No autenticado' }

    const { error: insertError } = await (supabase as any).from('manual_deals').insert({
        lead_name: input.leadName || null,
        client_name: input.clientName || null,
        email: input.email || null,
        user_id: input.userId || null,
        product_name: input.productName,
        product_type: input.productType,
        amount: input.amount,
        closed_at: input.closedAt,
        stage: input.stage || 'won',
        channel: input.channel,
        campaign: input.campaign || null,
        owner: input.owner || null,
        notes: input.notes || null,
        attribution_snapshot: input.attributionSnapshot || {},
        metadata: input.metadata || {},
        created_by: user.id,
    })

    if (insertError) {
        console.error('Error creating manual deal:', insertError)
        return { success: false, error: 'No se pudo guardar el deal' }
    }

    await recordAnalyticsServerEvent({
        eventName: 'manual_deal_created',
        eventSource: 'server',
        userId: user.id,
        touch: { funnel: 'manual_deal', source: input.channel, campaign: input.campaign || null },
        properties: {
            channel: input.channel,
            campaign: input.campaign || null,
            amount: input.amount,
            productType: input.productType,
        },
    })

    revalidatePath('/dashboard/admin/analytics')
    return { success: true }
}
