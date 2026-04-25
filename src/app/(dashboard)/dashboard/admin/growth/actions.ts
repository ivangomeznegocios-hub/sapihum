'use server'

import { createClient } from '@/lib/supabase/server'
import {
    approveGrowthReward,
    consolidateEligibleGrowthConversions,
    grantGrowthReward,
    markGrowthAttributionFraud,
    markGrowthConversionFraud,
    revokeGrowthReward,
    updateGrowthFraudFlagStatus,
    upsertGrowthOrganization,
    upsertGrowthProgramEnrollment,
} from '@/lib/growth/engine'
import { revalidatePath } from 'next/cache'

// ============================================
// PROCESS REWARD EVENT (mark as processed)
// ============================================
export async function processRewardEvent(rewardEventId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Solo administradores' }
        }

        const { error } = await (supabase as any)
            .from('invite_reward_events')
            .update({
                processed: true,
                processed_at: new Date().toISOString(),
            })
            .eq('id', rewardEventId)
            .eq('program_type', 'professional_invite')

        if (error) {
            console.error('Error processing reward event:', error)
            return { success: false, error: 'Error al procesar recompensa' }
        }

        revalidateGrowthAdminPaths()
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in processRewardEvent:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { supabase, user: null, error: 'Usuario no autenticado' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'admin') {
        return { supabase, user: null, error: 'Solo administradores' }
    }

    return { supabase, user, error: null }
}

function revalidateGrowthAdminPaths() {
    revalidatePath('/dashboard/admin/growth')
    revalidatePath('/dashboard/growth')
    revalidatePath('/dashboard/admin/growth/review/[entityType]/[entityId]', 'page')
}

export async function approveGrowthRewardAction(rewardId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        await approveGrowthReward({ rewardId, approvedBy: user.id, admin: supabase })
        revalidateGrowthAdminPaths()
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in approveGrowthRewardAction:', err)
        return { success: false, error: 'Error al aprobar reward' }
    }
}

export async function grantGrowthRewardAction(rewardId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        await grantGrowthReward({
            rewardId,
            grantedBy: user.id,
            admin: supabase,
            notes: 'Reward otorgado por admin desde panel growth',
        })
        revalidateGrowthAdminPaths()
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in grantGrowthRewardAction:', err)
        return { success: false, error: 'Error al otorgar reward' }
    }
}

export async function revokeGrowthRewardAction(rewardId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        await revokeGrowthReward({
            rewardId,
            revokedBy: user.id,
            reason: 'Reward revocado por admin desde panel growth',
            admin: supabase,
        })
        revalidateGrowthAdminPaths()
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in revokeGrowthRewardAction:', err)
        return { success: false, error: 'Error al revocar reward' }
    }
}

export async function consolidateGrowthNowAction(): Promise<{
    success: boolean
    qualified?: number
    blocked?: number
    error?: string
}> {
    try {
        const { supabase, error } = await requireAdmin()
        if (error) return { success: false, error }

        const result = await consolidateEligibleGrowthConversions({ admin: supabase })
        revalidateGrowthAdminPaths()
        return { success: true, ...result }
    } catch (err) {
        console.error('Unexpected error in consolidateGrowthNowAction:', err)
        return { success: false, error: 'Error al consolidar conversiones' }
    }
}

export async function updateMemberReferralConfigAction(formData: FormData): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        const attributionWindowDays = Number(formData.get('attributionWindowDays') || 30)
        const fixedDaysFallback = Number(formData.get('fixedDaysFallback') || 30)
        const consolidationRule = String(formData.get('consolidationRule') || 'first_renewal_paid')
        const fallbackConsolidationRule = String(formData.get('fallbackConsolidationRule') || 'billing_cycle_end')
        const safeAttributionWindow = Number.isFinite(attributionWindowDays) && attributionWindowDays > 0
            ? Math.trunc(attributionWindowDays)
            : 30
        const safeFixedDaysFallback = Number.isFinite(fixedDaysFallback) && fixedDaysFallback > 0
            ? Math.trunc(fixedDaysFallback)
            : 30
        const safeConsolidationRule = ['first_renewal_paid', 'billing_cycle_end', 'fixed_days'].includes(consolidationRule)
            ? consolidationRule
            : 'first_renewal_paid'
        const safeFallbackRule = ['billing_cycle_end', 'fixed_days'].includes(fallbackConsolidationRule)
            ? fallbackConsolidationRule
            : 'billing_cycle_end'

        const { data: current } = await (supabase as any)
            .from('growth_program_configs')
            .select('config_json')
            .eq('program_key', 'member_referral')
            .maybeSingle()

        const nextConfig = {
            ...((current?.config_json && typeof current.config_json === 'object') ? current.config_json : {}),
            attribution_window_days: safeAttributionWindow,
            consolidation_days: safeFixedDaysFallback,
            consolidation_rule: safeConsolidationRule,
            fallback_consolidation_rule: safeFallbackRule,
        }

        const { error: updateError } = await (supabase as any)
            .from('growth_program_configs')
            .upsert(
                {
                    program_key: 'member_referral',
                    config_json: nextConfig,
                    is_active: true,
                    updated_by: user.id,
                },
                { onConflict: 'program_key' }
            )

        if (updateError) {
            return { success: false, error: 'Error al guardar configuracion' }
        }

        revalidateGrowthAdminPaths()
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in updateMemberReferralConfigAction:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function upsertGrowthProgramEnrollmentAction(formData: FormData): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        const userLookup = String(formData.get('userLookup') || '').trim()
        const existingUserId = String(formData.get('userId') || '').trim()
        const programType = String(formData.get('programType') || 'host')
        const status = String(formData.get('status') || 'active')
        const tier = String(formData.get('tier') || 'base')
        const approvalNotes = String(formData.get('approvalNotes') || '').trim()

        if (!['host', 'ambassador'].includes(programType)) {
            return { success: false, error: 'Programa invalido' }
        }

        if (!['applied', 'approved', 'rejected', 'paused', 'active', 'terminated'].includes(status)) {
            return { success: false, error: 'Estado invalido' }
        }

        if (!['base', 'pro', 'elite'].includes(tier)) {
            return { success: false, error: 'Tier invalido' }
        }

        const lookup = existingUserId || userLookup
        if (!lookup) {
            return { success: false, error: 'Indica email o ID de usuario' }
        }

        const query = (supabase as any)
            .from('profiles')
            .select('id, email, full_name, role')
            .limit(1)

        const { data: profiles, error: profileError } = isUuid(lookup)
            ? await query.eq('id', lookup)
            : await query.ilike('email', lookup)

        if (profileError) {
            return { success: false, error: 'Error al buscar usuario' }
        }

        const targetUser = profiles?.[0]
        if (!targetUser?.id) {
            return { success: false, error: 'Usuario no encontrado' }
        }

        await upsertGrowthProgramEnrollment({
            userId: targetUser.id,
            programType: programType as 'host' | 'ambassador',
            status: status as 'applied' | 'approved' | 'rejected' | 'paused' | 'active' | 'terminated',
            tier: tier as 'base' | 'pro' | 'elite',
            approvalNotes: approvalNotes || null,
            approvedBy: user.id,
            admin: supabase,
        })

        revalidateGrowthAdminPaths()
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in upsertGrowthProgramEnrollmentAction:', err)
        return { success: false, error: 'Error al guardar programa' }
    }
}

function parseJsonObject(value: string) {
    if (!value.trim()) return {}
    try {
        const parsed = JSON.parse(value)
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
        return {}
    }
}

export async function upsertGrowthOrganizationAction(formData: FormData): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        const organizationId = String(formData.get('organizationId') || '').trim() || null
        const name = String(formData.get('name') || '').trim()
        const organizationType = String(formData.get('organizationType') || 'other')
        const status = String(formData.get('status') || 'lead')
        const partnerCode = String(formData.get('partnerCode') || '').trim()
        const landingSlug = String(formData.get('landingSlug') || '').trim()
        const contactName = String(formData.get('contactName') || '').trim()
        const contactEmail = String(formData.get('contactEmail') || '').trim()
        const contactPhone = String(formData.get('contactPhone') || '').trim()
        const benefitModel = String(formData.get('benefitModel') || 'custom')
        const benefitConfig = parseJsonObject(String(formData.get('benefitConfig') || ''))

        if (!name) return { success: false, error: 'Nombre requerido' }
        if (!['university', 'association', 'college', 'community', 'other'].includes(organizationType)) {
            return { success: false, error: 'Tipo de organizacion invalido' }
        }
        if (!['lead', 'prospect', 'active_partner', 'inactive_partner'].includes(status)) {
            return { success: false, error: 'Estado de organizacion invalido' }
        }
        if (!['discount', 'revenue_share', 'bulk_access', 'custom'].includes(benefitModel)) {
            return { success: false, error: 'Modelo de beneficio invalido' }
        }

        await upsertGrowthOrganization({
            organizationId,
            name,
            organizationType: organizationType as 'university' | 'association' | 'college' | 'community' | 'other',
            status: status as 'lead' | 'prospect' | 'active_partner' | 'inactive_partner',
            partnerCode: partnerCode || null,
            landingSlug: landingSlug || null,
            contactName: contactName || null,
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
            benefitModel: benefitModel as 'discount' | 'revenue_share' | 'bulk_access' | 'custom',
            benefitConfig,
            createdBy: user.id,
            admin: supabase,
        })

        revalidateGrowthAdminPaths()
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in upsertGrowthOrganizationAction:', err)
        return { success: false, error: 'Error al guardar organizacion' }
    }
}

export async function markGrowthAttributionFraudAction(attributionId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        await markGrowthAttributionFraud({
            attributionId,
            reviewedBy: user.id,
            notes: 'Caso marcado como fraude desde admin',
            admin: supabase,
        })
        revalidateGrowthAdminPaths()
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in markGrowthAttributionFraudAction:', err)
        return { success: false, error: 'Error al marcar fraude en la atribucion' }
    }
}

export async function markGrowthConversionFraudAction(conversionId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        await markGrowthConversionFraud({
            conversionId,
            reviewedBy: user.id,
            notes: 'Conversion marcada como fraude desde admin',
            admin: supabase,
        })
        revalidateGrowthAdminPaths()
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in markGrowthConversionFraudAction:', err)
        return { success: false, error: 'Error al marcar fraude en la conversion' }
    }
}

export async function reviewGrowthFraudFlagAction(
    flagId: string,
    status: 'reviewed' | 'dismissed' | 'confirmed'
): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        await updateGrowthFraudFlagStatus({
            flagId,
            status,
            reviewedBy: user.id,
            admin: supabase,
        })
        revalidateGrowthAdminPaths()
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in reviewGrowthFraudFlagAction:', err)
        return { success: false, error: 'Error al actualizar el flag de fraude' }
    }
}
