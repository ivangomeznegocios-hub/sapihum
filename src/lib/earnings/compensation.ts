import type { EarningType } from '@/types/database'

export const DEFAULT_SPEAKER_COMPENSATION_TYPE = 'percentage'
export const DEFAULT_SPEAKER_PERCENTAGE_RATE = 0.5

export type SpeakerCompensationType = 'percentage' | 'fixed' | 'variable'

export interface EventSpeakerCompensationRule {
    speakerId: string
    displayOrder: number
    compensationType: SpeakerCompensationType
    compensationValue: number | null
    source: 'event_speaker' | 'speaker_default'
}

export interface CalculatedSpeakerCompensation {
    compensationType: SpeakerCompensationType
    compensationValue: number | null
    commissionRate: number
    netAmount: number | null
    isAutomatic: boolean
}

interface UpsertAutomaticEventSpeakerEarningsParams {
    supabase: any
    eventId: string
    studentId: string | null
    grossAmount: number
    earningType: EarningType
    attendanceDate: string
    releaseDate: string
    monthKey: string
    sourceTransactionId?: string | null
    attendanceLogId?: string | null
    description?: string | null
}

function roundCurrency(value: number) {
    return Math.round(value * 100) / 100
}

export function normalizeSpeakerCompensationType(value: unknown): SpeakerCompensationType {
    if (value === 'fixed' || value === 'variable') {
        return value
    }

    return DEFAULT_SPEAKER_COMPENSATION_TYPE
}

export function normalizeSpeakerCompensationValue(
    compensationType: SpeakerCompensationType,
    value: unknown
): number | null {
    if (value === null || value === undefined || value === '') {
        return compensationType === 'percentage' ? DEFAULT_SPEAKER_PERCENTAGE_RATE : null
    }

    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) {
        return compensationType === 'percentage' ? DEFAULT_SPEAKER_PERCENTAGE_RATE : null
    }

    if (compensationType === 'percentage') {
        if (numericValue > 1) {
            return Math.max(0, numericValue / 100)
        }

        return Math.max(0, numericValue)
    }

    return Math.max(0, numericValue)
}

export function calculateSpeakerCompensation(
    grossAmount: number,
    compensationTypeRaw: unknown,
    compensationValueRaw: unknown
): CalculatedSpeakerCompensation {
    const compensationType = normalizeSpeakerCompensationType(compensationTypeRaw)
    const compensationValue = normalizeSpeakerCompensationValue(compensationType, compensationValueRaw)

    if (compensationType === 'variable') {
        return {
            compensationType,
            compensationValue,
            commissionRate: 0,
            netAmount: null,
            isAutomatic: false,
        }
    }

    if (compensationType === 'fixed') {
        const fixedAmount = roundCurrency(compensationValue ?? 0)
        const commissionRate = grossAmount > 0 ? roundCurrency(fixedAmount / grossAmount) : 0

        return {
            compensationType,
            compensationValue: fixedAmount,
            commissionRate,
            netAmount: fixedAmount,
            isAutomatic: true,
        }
    }

    const rate = compensationValue ?? DEFAULT_SPEAKER_PERCENTAGE_RATE
    return {
        compensationType,
        compensationValue: rate,
        commissionRate: rate,
        netAmount: roundCurrency(grossAmount * rate),
        isAutomatic: true,
    }
}

export function formatSpeakerCompensationLabel(
    compensationTypeRaw: unknown,
    compensationValueRaw: unknown,
    fallbackCommissionRateRaw?: unknown
) {
    const compensationType = normalizeSpeakerCompensationType(compensationTypeRaw)
    const fallbackValue = compensationType === 'percentage'
        ? normalizeSpeakerCompensationValue(compensationType, fallbackCommissionRateRaw)
        : compensationValueRaw
    const compensationValue = normalizeSpeakerCompensationValue(
        compensationType,
        compensationValueRaw ?? fallbackValue
    )

    if (compensationType === 'fixed') {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(compensationValue ?? 0)
    }

    if (compensationType === 'variable') {
        return 'Variable / manual'
    }

    const percentValue = (compensationValue ?? DEFAULT_SPEAKER_PERCENTAGE_RATE) * 100
    const formattedPercent = Number.isInteger(percentValue)
        ? percentValue.toFixed(0)
        : percentValue.toFixed(1)

    return `${formattedPercent}%`
}

export async function getEventSpeakerCompensationRules(
    supabase: any,
    eventId: string
): Promise<EventSpeakerCompensationRule[]> {
    const { data: linkedSpeakers } = await (supabase
        .from('event_speakers') as any)
        .select('speaker_id, display_order, compensation_type, compensation_value')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

    const normalizedLinkedSpeakers = Array.isArray(linkedSpeakers) ? linkedSpeakers : []

    if (normalizedLinkedSpeakers.length > 0) {
        const speakerIds = normalizedLinkedSpeakers
            .map((row: any) => row.speaker_id)
            .filter((speakerId: unknown): speakerId is string => typeof speakerId === 'string' && speakerId.length > 0)

        const missingPercentageValueSpeakerIds = normalizedLinkedSpeakers
            .filter((row: any) => normalizeSpeakerCompensationType(row.compensation_type) === 'percentage' && row.compensation_value == null)
            .map((row: any) => row.speaker_id)

        let speakerRateMap = new Map<string, number>()

        if (missingPercentageValueSpeakerIds.length > 0) {
            const { data: speakers } = await (supabase
                .from('speakers') as any)
                .select('id, commission_rate')
                .in('id', missingPercentageValueSpeakerIds)

            speakerRateMap = new Map(
                (speakers ?? []).map((speaker: any) => [
                    speaker.id,
                    Number(speaker.commission_rate ?? DEFAULT_SPEAKER_PERCENTAGE_RATE),
                ])
            )
        }

        return normalizedLinkedSpeakers
            .filter((row: any) => speakerIds.includes(row.speaker_id))
            .map((row: any, index: number) => {
                const compensationType = normalizeSpeakerCompensationType(row.compensation_type)
                const fallbackValue = compensationType === 'percentage'
                    ? speakerRateMap.get(row.speaker_id) ?? DEFAULT_SPEAKER_PERCENTAGE_RATE
                    : row.compensation_value

                return {
                    speakerId: row.speaker_id,
                    displayOrder: Number(row.display_order ?? index),
                    compensationType,
                    compensationValue: normalizeSpeakerCompensationValue(compensationType, row.compensation_value ?? fallbackValue),
                    source: 'event_speaker' as const,
                }
            })
    }

    const { data: eventOwner } = await (supabase
        .from('events') as any)
        .select('created_by')
        .eq('id', eventId)
        .maybeSingle()

    if (!eventOwner?.created_by) {
        return []
    }

    const { data: speakerProfile } = await (supabase
        .from('speakers') as any)
        .select('id, commission_rate')
        .eq('id', eventOwner.created_by)
        .maybeSingle()

    if (!speakerProfile?.id) {
        return []
    }

    return [{
        speakerId: speakerProfile.id,
        displayOrder: 0,
        compensationType: DEFAULT_SPEAKER_COMPENSATION_TYPE,
        compensationValue: normalizeSpeakerCompensationValue(
            DEFAULT_SPEAKER_COMPENSATION_TYPE,
            speakerProfile.commission_rate ?? DEFAULT_SPEAKER_PERCENTAGE_RATE
        ),
        source: 'speaker_default',
    }]
}

export async function upsertAutomaticEventSpeakerEarnings(params: UpsertAutomaticEventSpeakerEarningsParams) {
    if (!params.studentId || params.grossAmount <= 0) {
        return { applied: [], skippedManual: [] as EventSpeakerCompensationRule[] }
    }

    const rules = await getEventSpeakerCompensationRules(params.supabase, params.eventId)

    const applied: Array<{
        speakerId: string
        compensationType: SpeakerCompensationType
        compensationValue: number | null
        commissionRate: number
        netAmount: number
    }> = []
    const skippedManual: EventSpeakerCompensationRule[] = []

    for (const rule of rules) {
        const calculation = calculateSpeakerCompensation(
            params.grossAmount,
            rule.compensationType,
            rule.compensationValue
        )

        if (!calculation.isAutomatic || calculation.netAmount == null) {
            skippedManual.push(rule)
            continue
        }

        await (params.supabase.from('speaker_earnings') as any)
            .upsert({
                speaker_id: rule.speakerId,
                event_id: params.eventId,
                student_id: params.studentId,
                earning_type: params.earningType,
                gross_amount: params.grossAmount,
                commission_rate: calculation.commissionRate,
                compensation_type: calculation.compensationType,
                compensation_value: calculation.compensationValue,
                net_amount: calculation.netAmount,
                status: 'pending',
                attendance_date: params.attendanceDate,
                release_date: params.releaseDate,
                source_transaction_id: params.sourceTransactionId ?? null,
                attendance_log_id: params.attendanceLogId ?? null,
                month_key: params.monthKey,
                description: params.description ?? null,
            }, { onConflict: 'speaker_id,event_id,student_id' })

        applied.push({
            speakerId: rule.speakerId,
            compensationType: calculation.compensationType,
            compensationValue: calculation.compensationValue,
            commissionRate: calculation.commissionRate,
            netAmount: calculation.netAmount,
        })
    }

    return { applied, skippedManual }
}
