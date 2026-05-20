export type SaleOrigin = 'speaker_direct' | 'sapihum_channel' | 'manual_adjustment'
export type PriceType = 'public' | 'member' | 'manual'

export interface CommerceAttribution {
    saleOrigin: SaleOrigin
    salesLinkId: string | null
    attributedSpeakerId: string | null
    speakerCode: string | null
}

export interface CommissionRuleSnapshot {
    ruleId: string | null
    scope: 'global' | 'event' | 'speaker_event' | 'default'
    saleOrigin: SaleOrigin
    speakerPercentage: number
    sapihumPercentage: number
    resolvedAt: string
}

const DEFAULT_DIRECT_SPEAKER_PERCENTAGE = 0.8
const DEFAULT_SAPIHUM_CHANNEL_SPEAKER_PERCENTAGE = 0.5

function toBooleanFlag(value: string | undefined) {
    return value === '1' || value === 'true' || value === 'TRUE'
}

export function isSpeakerCommerceEngineEnabled() {
    return toBooleanFlag(process.env.ENABLE_SPEAKER_COMMERCE_ENGINE)
}

export function isSpeakerPayoutRequestsEnabled() {
    return toBooleanFlag(process.env.ENABLE_SPEAKER_PAYOUT_REQUESTS)
}

export function roundCurrency(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

export function normalizeSaleOrigin(value: unknown): SaleOrigin {
    if (value === 'speaker_direct' || value === 'manual_adjustment') {
        return value
    }

    return 'sapihum_channel'
}

export function normalizePriceType(value: unknown): PriceType {
    if (value === 'member' || value === 'manual') {
        return value
    }

    return 'public'
}

export function inferPriceType(params: {
    amountPaid: number
    publicPrice?: number | null
    memberPrice?: number | null
}): PriceType {
    const amountPaid = roundCurrency(Number(params.amountPaid ?? 0))
    const memberPrice = params.memberPrice == null ? null : roundCurrency(Number(params.memberPrice))
    const publicPrice = params.publicPrice == null ? null : roundCurrency(Number(params.publicPrice))

    if (memberPrice != null && amountPaid === memberPrice && (publicPrice == null || memberPrice < publicPrice)) {
        return 'member'
    }

    return 'public'
}

export async function resolveSalesLinkAttribution(params: {
    supabase: any
    eventId: string
    speakerCode?: string | null
}): Promise<CommerceAttribution> {
    const speakerCode = typeof params.speakerCode === 'string' ? params.speakerCode.trim() : ''

    if (!speakerCode) {
        return {
            saleOrigin: 'sapihum_channel',
            salesLinkId: null,
            attributedSpeakerId: null,
            speakerCode: null,
        }
    }

    const { data: link, error } = await (params.supabase
        .from('event_speaker_sales_links') as any)
        .select('id, event_id, speaker_id, is_active')
        .eq('event_id', params.eventId)
        .eq('code', speakerCode)
        .eq('is_active', true)
        .maybeSingle()

    if (error || !link?.id || !link?.speaker_id) {
        return {
            saleOrigin: 'sapihum_channel',
            salesLinkId: null,
            attributedSpeakerId: null,
            speakerCode,
        }
    }

    return {
        saleOrigin: 'speaker_direct',
        salesLinkId: link.id,
        attributedSpeakerId: link.speaker_id,
        speakerCode,
    }
}

export function attributionFromStripeMetadata(metadata?: Record<string, string | undefined> | null): CommerceAttribution {
    const saleOrigin = normalizeSaleOrigin(metadata?.sale_origin)
    const salesLinkId = metadata?.sales_link_id || null
    const attributedSpeakerId = metadata?.attributed_speaker_id || null
    const speakerCode = metadata?.speaker_code || null

    if (saleOrigin === 'speaker_direct' && attributedSpeakerId) {
        return { saleOrigin, salesLinkId, attributedSpeakerId, speakerCode }
    }

    return {
        saleOrigin: 'sapihum_channel',
        salesLinkId: null,
        attributedSpeakerId: null,
        speakerCode,
    }
}

async function resolveCommissionRule(params: {
    supabase: any
    eventId: string
    speakerId: string
    saleOrigin: SaleOrigin
}): Promise<CommissionRuleSnapshot> {
    const { data: speakerEventRule } = await (params.supabase
        .from('sales_commission_rules') as any)
        .select('id, scope, sale_origin, speaker_percentage, sapihum_percentage')
        .eq('scope', 'speaker_event')
        .eq('event_id', params.eventId)
        .eq('speaker_id', params.speakerId)
        .eq('sale_origin', params.saleOrigin)
        .eq('is_active', true)
        .maybeSingle()

    const { data: eventRule } = speakerEventRule?.id
        ? { data: null }
        : await (params.supabase
            .from('sales_commission_rules') as any)
            .select('id, scope, sale_origin, speaker_percentage, sapihum_percentage')
            .eq('scope', 'event')
            .eq('event_id', params.eventId)
            .eq('sale_origin', params.saleOrigin)
            .eq('is_active', true)
            .maybeSingle()

    const { data: globalRule } = speakerEventRule?.id || eventRule?.id
        ? { data: null }
        : await (params.supabase
            .from('sales_commission_rules') as any)
            .select('id, scope, sale_origin, speaker_percentage, sapihum_percentage')
            .eq('scope', 'global')
            .eq('sale_origin', params.saleOrigin)
            .eq('is_active', true)
            .maybeSingle()

    const rule = speakerEventRule ?? eventRule ?? globalRule
    const speakerPercentage = rule?.speaker_percentage == null
        ? params.saleOrigin === 'speaker_direct'
            ? DEFAULT_DIRECT_SPEAKER_PERCENTAGE
            : DEFAULT_SAPIHUM_CHANNEL_SPEAKER_PERCENTAGE
        : Number(rule.speaker_percentage)

    return {
        ruleId: rule?.id ?? null,
        scope: rule?.scope ?? 'default',
        saleOrigin: params.saleOrigin,
        speakerPercentage,
        sapihumPercentage: rule?.sapihum_percentage == null ? roundCurrency(1 - speakerPercentage) : Number(rule.sapihum_percentage),
        resolvedAt: new Date().toISOString(),
    }
}

async function getEventSpeakers(params: {
    supabase: any
    eventId: string
    saleOrigin: SaleOrigin
    attributedSpeakerId: string | null
}) {
    const { data: linkedSpeakers } = await (params.supabase
        .from('event_speakers') as any)
        .select('speaker_id, display_order')
        .eq('event_id', params.eventId)
        .order('display_order', { ascending: true })

    const speakers = (linkedSpeakers ?? [])
        .map((row: any) => row.speaker_id)
        .filter((speakerId: unknown): speakerId is string => typeof speakerId === 'string' && speakerId.length > 0)

    if (params.saleOrigin === 'speaker_direct' && params.attributedSpeakerId && speakers.includes(params.attributedSpeakerId)) {
        return [params.attributedSpeakerId]
    }

    if (speakers.length > 0) {
        return speakers
    }

    const { data: event } = await (params.supabase
        .from('events') as any)
        .select('created_by')
        .eq('id', params.eventId)
        .maybeSingle()

    if (!event?.created_by) {
        return []
    }

    const { data: speaker } = await (params.supabase
        .from('speakers') as any)
        .select('id')
        .eq('id', event.created_by)
        .maybeSingle()

    return speaker?.id ? [speaker.id] : []
}

async function hasExplicitSpeakerEventRule(params: {
    supabase: any
    eventId: string
    speakerId: string
    saleOrigin: SaleOrigin
}) {
    const { data } = await (params.supabase
        .from('sales_commission_rules') as any)
        .select('id')
        .eq('scope', 'speaker_event')
        .eq('event_id', params.eventId)
        .eq('speaker_id', params.speakerId)
        .eq('sale_origin', params.saleOrigin)
        .eq('is_active', true)
        .maybeSingle()

    return Boolean(data?.id)
}

export async function upsertCommerceSpeakerEarnings(params: {
    supabase: any
    eventId: string
    studentId: string | null
    transactionId: string | null
    grossAmount: number
    attendanceDate: string
    releaseDate: string
    monthKey: string
    metadata?: Record<string, string | undefined> | null
    purchaseType?: 'event_purchase' | 'formation_purchase'
    sourcePurchaseId?: string | null
    priceType?: PriceType
}) {
    if (!isSpeakerCommerceEngineEnabled()) {
        return { handled: false, applied: [], skipped: [] as string[] }
    }

    if (!params.studentId || params.grossAmount <= 0) {
        return { handled: true, applied: [], skipped: [] as string[] }
    }

    const attribution = attributionFromStripeMetadata(params.metadata)
    const speakerIds = await getEventSpeakers({
        supabase: params.supabase,
        eventId: params.eventId,
        saleOrigin: attribution.saleOrigin,
        attributedSpeakerId: attribution.attributedSpeakerId,
    })

    const skipped: string[] = []
    const applied: Array<{ speakerId: string; netAmount: number; commissionRate: number }> = []

    if (speakerIds.length > 1 && attribution.saleOrigin !== 'speaker_direct') {
        const explicitResults = await Promise.all(
            speakerIds.map((speakerId: string) => hasExplicitSpeakerEventRule({
                supabase: params.supabase,
                eventId: params.eventId,
                speakerId,
                saleOrigin: attribution.saleOrigin,
            }))
        )

        if (explicitResults.some((hasRule) => !hasRule)) {
            console.warn('[SpeakerCommerce] Skipped ambiguous multi-speaker payout without explicit rules', {
                eventId: params.eventId,
                speakerIds,
                saleOrigin: attribution.saleOrigin,
            })

            return {
                handled: true,
                applied,
                skipped: speakerIds,
            }
        }
    }

    for (const speakerId of speakerIds) {
        const rule = await resolveCommissionRule({
            supabase: params.supabase,
            eventId: params.eventId,
            speakerId,
            saleOrigin: attribution.saleOrigin,
        })
        const netAmount = roundCurrency(params.grossAmount * rule.speakerPercentage)
        const sapihumAmount = roundCurrency(params.grossAmount - netAmount)
        const now = new Date().toISOString()

        await (params.supabase.from('speaker_earnings') as any)
            .upsert({
                speaker_id: speakerId,
                event_id: params.eventId,
                student_id: params.studentId,
                earning_type: 'premium_commission',
                gross_amount: params.grossAmount,
                amount_paid: params.grossAmount,
                sapihum_amount: sapihumAmount,
                commission_rate: rule.speakerPercentage,
                compensation_type: 'percentage',
                compensation_value: rule.speakerPercentage,
                net_amount: netAmount,
                status: 'pending',
                financial_status: 'pending',
                attendance_date: params.attendanceDate,
                release_date: params.releaseDate,
                source_transaction_id: params.transactionId ?? null,
                source_purchase_type: params.purchaseType ?? 'event_purchase',
                source_purchase_id: params.sourcePurchaseId ?? null,
                month_key: params.monthKey,
                sale_origin: attribution.saleOrigin,
                price_type: normalizePriceType(params.priceType),
                attributed_speaker_id: attribution.attributedSpeakerId ?? speakerId,
                sales_link_id: attribution.salesLinkId,
                commission_rule_id: rule.ruleId,
                commission_snapshot: {
                    ...rule,
                    attribution,
                    grossAmount: params.grossAmount,
                    netAmount,
                    sapihumAmount,
                    purchaseType: params.purchaseType ?? 'event_purchase',
                },
                locked_at: now,
            }, { onConflict: 'speaker_id,event_id,student_id' })

        applied.push({
            speakerId,
            netAmount,
            commissionRate: rule.speakerPercentage,
        })
    }

    return { handled: true, applied, skipped }
}

export async function createRefundAdjustmentForPaidEarning(params: {
    supabase: any
    earning: any
    reason: string
}) {
    const netAmount = Number(params.earning?.net_amount ?? 0)
    if (!params.earning?.speaker_id || netAmount <= 0) {
        return null
    }

    const now = new Date()
    const { data, error } = await (params.supabase.from('speaker_earnings') as any)
        .insert({
            speaker_id: params.earning.speaker_id,
            event_id: null,
            student_id: null,
            earning_type: 'manual_bonus',
            gross_amount: -netAmount,
            amount_paid: -netAmount,
            sapihum_amount: 0,
            commission_rate: 1,
            compensation_type: 'fixed',
            compensation_value: -netAmount,
            net_amount: -netAmount,
            status: 'pending',
            financial_status: 'pending',
            attendance_date: now.toISOString().split('T')[0],
            release_date: now.toISOString().split('T')[0],
            month_key: now.toISOString().slice(0, 7),
            sale_origin: 'manual_adjustment',
            price_type: 'manual',
            source_transaction_id: params.earning.source_transaction_id ?? null,
            source_purchase_type: 'manual',
            description: `Ajuste negativo por reembolso: ${params.reason}`,
            locked_at: now.toISOString(),
            commission_snapshot: {
                source: 'refund_adjustment',
                originalEarningId: params.earning.id,
                reason: params.reason,
            },
        })
        .select('id')
        .single()

    if (error) {
        throw error
    }

    return data?.id ?? null
}
