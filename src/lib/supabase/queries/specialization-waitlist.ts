import { createAdminClient } from '@/lib/supabase/server'
import { getSpecializationByCode } from '@/lib/specializations'
import type { SpecializationCode } from '@/types/database'

export interface SpecializationDemandRow {
    specialization_code: SpecializationCode
    specialization_name: string
    demand_count: number
}

function monthRange(offset: number) {
    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1, 0, 0, 0))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset + 1, 1, 0, 0, 0))
    return { start: start.toISOString(), end: end.toISOString() }
}

/**
 * Commercial rule helper:
 * publish a monthly demand ranking and pick the most requested specialization.
 */
export async function getMonthlySpecializationDemandRanking(monthOffset = 0): Promise<SpecializationDemandRow[]> {
    const admin = await createAdminClient()
    const { start, end } = monthRange(monthOffset)

    const { data, error } = await (admin as any)
        .from('specialization_waitlist')
        .select('specialization_code')
        .gte('created_at', start)
        .lt('created_at', end)

    if (error) {
        console.error('Error fetching specialization waitlist ranking:', error)
        return []
    }

    const counts = new Map<SpecializationCode, number>()
    for (const row of data || []) {
        const code = row.specialization_code as SpecializationCode
        counts.set(code, (counts.get(code) || 0) + 1)
    }

    return Array.from(counts.entries())
        .map(([specialization_code, demand_count]) => ({
            specialization_code,
            specialization_name: getSpecializationByCode(specialization_code)?.name || specialization_code,
            demand_count,
        }))
        .sort((a, b) => b.demand_count - a.demand_count)
}

