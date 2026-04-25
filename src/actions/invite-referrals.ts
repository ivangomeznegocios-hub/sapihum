'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
import {
    applyGrowthAttributionForRegisteredUser,
    ensureGrowthProfileForUser,
    markGrowthAttributionRegistered,
} from '@/lib/growth/engine'
import type { InviteCode, InviteAttribution } from '@/types/database'

// ============================================
// GET OR CREATE INVITE CODE
// ============================================

/**
 * Get the current user's invite code, or create one if it doesn't exist.
 * Every user gets exactly one invite code.
 */
export async function getOrCreateInviteCode(): Promise<{
    success: boolean
    code?: InviteCode
    error?: string
}> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' }
        }

        // 1. Check if user already has a code
        const { data: existing, error: fetchError } = await (supabase as any)
            .from('invite_codes')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle()

        if (fetchError) {
            console.error('Error fetching invite code:', JSON.stringify(fetchError, null, 2))
            return { success: false, error: 'Error al buscar código de invitación' }
        }

        if (existing) {
            await ensureGrowthProfileForUser({
                userId: user.id,
                programType: 'member',
                referralCode: existing.code,
                inviteCodeId: existing.id,
                admin: await createAdminClient(),
            })
            return { success: true, code: existing as InviteCode }
        }

        // 2. Create a new code (DB auto-generates the code via default)
        // Use admin client to bypass any RLS/trigger race conditions during creation
        const adminClient = await createAdminClient()
        const { data: newCode, error: insertError } = await (adminClient as any)
            .from('invite_codes')
            .insert({ owner_id: user.id })
            .select()
            .single()

        if (insertError) {
            console.error('Error creating invite code:', JSON.stringify(insertError, null, 2))
            return { success: false, error: 'Error al crear código de invitación' }
        }

        await ensureGrowthProfileForUser({
            userId: user.id,
            programType: 'member',
            referralCode: newCode.code,
            inviteCodeId: newCode.id,
            admin: adminClient,
        })

        return { success: true, code: newCode as InviteCode }
    } catch (err: any) {
        console.error('Unexpected error in getOrCreateInviteCode:', err?.message || JSON.stringify(err, null, 2))
        return { success: false, error: 'Error inesperado' }
    }
}

// ============================================
// APPLY INVITE CODE (during registration)
// ============================================

/**
 * Apply an invite code for a newly registered user.
 * Creates the attribution record linking referrer → referred.
 * Uses admin client to bypass RLS since the user just registered.
 */
export async function applyInviteCode(
    referredUserId: string,
    code: string
): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const supabase = await createAdminClient()
        const growthResult = await applyGrowthAttributionForRegisteredUser({
            inviteeUserId: referredUserId,
            code,
            captureMethod: 'manual_code',
            admin: supabase,
        })
        if (growthResult.success && (growthResult as any).sourceType !== 'member') {
            return { success: true }
        }

        // 1. Validate the code using the DB function
        const { data: validation, error: valError } = await (supabase as any)
            .rpc('validate_invite_code', { p_code: code.toUpperCase() })

        if (valError || !validation || validation.length === 0) {
            console.error('Error validating invite code:', valError)
            return { success: false, error: 'Código de invitación inválido' }
        }

        const result = validation[0]
        if (!result.is_valid) {
            return { success: false, error: result.reason || 'Código inválido' }
        }

        // 2. Prevent self-referral
        if (result.code_owner_id === referredUserId) {
            await applyGrowthAttributionForRegisteredUser({
                inviteeUserId: referredUserId,
                code,
                captureMethod: 'manual_code',
                admin: supabase,
            })
            return { success: false, error: 'No puedes usar tu propio código de invitación' }
        }

        // 3. Check if user was already referred
        const { data: existingAttr } = await (supabase as any)
            .from('invite_attributions')
            .select('id')
            .eq('referred_id', referredUserId)
            .eq('program_type', 'professional_invite')
            .maybeSingle()

        if (existingAttr) {
            await applyGrowthAttributionForRegisteredUser({
                inviteeUserId: referredUserId,
                code,
                captureMethod: 'manual_code',
                admin: supabase,
            })
            // Already attributed, silently succeed
            return { success: true }
        }

        // 4. Create the attribution
        const { error: insertError } = await (supabase as any)
            .from('invite_attributions')
            .insert({
                invite_code_id: result.code_id,
                referrer_id: result.code_owner_id,
                referred_id: referredUserId,
                program_type: 'professional_invite',
                status: 'pending',
            })

        if (insertError) {
            console.error('Error creating invite attribution:', insertError)
            return { success: false, error: 'Error al registrar la invitación' }
        }

        await applyGrowthAttributionForRegisteredUser({
            inviteeUserId: referredUserId,
            code,
            captureMethod: 'manual_code',
            admin: supabase,
        })

        await recordAnalyticsServerEvent({
            eventName: 'invite_applied',
            eventSource: 'server',
            userId: referredUserId,
            properties: {
                inviteCodeId: result.code_id,
                referrerId: result.code_owner_id,
                programType: 'professional_invite',
            },
        })

        return { success: true }
    } catch (err) {
        console.error('Unexpected error in applyInviteCode:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

// ============================================
// COMPLETE ATTRIBUTION (mark as completed)
// ============================================

/**
 * Mark an invite attribution as completed (e.g., after email verification).
 * This is separate from rewarding — it just confirms the referral is valid.
 */
export async function completeInviteAttribution(
    referredUserId: string
): Promise<{
    success: boolean
    attributionId?: string
    error?: string
}> {
    try {
        const supabase = await createAdminClient()

        const { data, error } = await (supabase as any)
            .from('invite_attributions')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
            })
            .eq('referred_id', referredUserId)
            .eq('program_type', 'professional_invite')
            .eq('status', 'pending')
            .select('id')
            .maybeSingle()

        if (error) {
            console.error('Error completing attribution:', error)
            return { success: false, error: 'Error al completar atribución' }
        }

        if (data?.id) {
            await markGrowthAttributionRegistered(referredUserId, supabase)

            await recordAnalyticsServerEvent({
                eventName: 'invite_activated',
                eventSource: 'server',
                userId: referredUserId,
                properties: {
                    attributionId: data.id,
                    programType: 'professional_invite',
                },
            })
        }

        return { success: true, attributionId: data?.id }
    } catch (err) {
        console.error('Unexpected error in completeInviteAttribution:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

// ============================================
// GET MY INVITE STATS
// ============================================

/**
 * Get invite statistics for the current user.
 * Returns code info, total invites, completed, and rewarded counts.
 */
export async function getMyInviteStats(): Promise<{
    success: boolean
    stats?: {
        code: string
        totalInvites: number
        completedInvites: number
        rewardedInvites: number
        pendingInvites: number
        recentInvites: InviteAttribution[]
    }
    error?: string
}> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' }
        }

        // 1. Get or create the user's invite code
        const codeResult = await getOrCreateInviteCode()
        if (!codeResult.success || !codeResult.code) {
            return { success: false, error: codeResult.error }
        }

        // 2. Get attributions
        const { data: attributions, error: attrError } = await (supabase as any)
            .from('invite_attributions')
            .select('*')
            .eq('referrer_id', user.id)
            .eq('program_type', 'professional_invite')
            .order('attributed_at', { ascending: false })

        if (attrError) {
            console.error('Error fetching attributions:', attrError)
            return { success: false, error: 'Error al obtener estadísticas' }
        }

        const attrs = (attributions || []) as InviteAttribution[]

        return {
            success: true,
            stats: {
                code: codeResult.code.code,
                totalInvites: attrs.length,
                completedInvites: attrs.filter(a => a.status === 'completed' || a.status === 'rewarded').length,
                rewardedInvites: attrs.filter(a => a.status === 'rewarded').length,
                pendingInvites: attrs.filter(a => a.status === 'pending').length,
                recentInvites: attrs.slice(0, 10),
            },
        }
    } catch (err) {
        console.error('Unexpected error in getMyInviteStats:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

// ============================================
// PROCESS INVITE REWARD (stub — reward-agnostic)
// ============================================

/**
 * Create a reward event for an invite attribution.
 * This is a stub that records the reward — the actual fulfillment
 * (granting credits, unlocking courses, etc.) will be implemented
 * when reward types are finalized.
 *
 * @param attributionId - The attribution that triggered the reward
 * @param beneficiaryId - Who receives the reward (can be referrer OR referred)
 * @param rewardType - Type of reward
 * @param rewardValue - JSON value describing the reward
 * @param triggerEvent - What triggered the reward (signup, first_purchase, etc.)
 */
export async function createInviteRewardEvent(
    attributionId: string,
    beneficiaryId: string,
    rewardType: 'credit' | 'discount' | 'unlock' | 'commission' | 'cash_bonus' | 'membership_benefit' | 'custom',
    rewardValue: Record<string, any>,
    triggerEvent: string,
): Promise<{
    success: boolean
    rewardEventId?: string
    error?: string
}> {
    try {
        const supabase = await createAdminClient()
        const { data: attribution, error: attributionError } = await (supabase as any)
            .from('invite_attributions')
            .select('id, program_type')
            .eq('id', attributionId)
            .maybeSingle()

        if (attributionError || !attribution) {
            console.error('Error loading invite attribution:', attributionError)
            return { success: false, error: 'No se encontro la invitacion profesional' }
        }

        if (attribution.program_type !== 'professional_invite') {
            return { success: false, error: 'Solo las invitaciones profesionales pueden generar recompensas' }
        }

        const { data, error } = await (supabase as any)
            .from('invite_reward_events')
            .insert({
                attribution_id: attributionId,
                beneficiary_id: beneficiaryId,
                program_type: 'professional_invite',
                reward_type: rewardType,
                reward_value: rewardValue,
                trigger_event: triggerEvent,
            })
            .select('id')
            .single()

        if (error) {
            console.error('Error creating reward event:', error)
            return { success: false, error: 'Error al crear evento de recompensa' }
        }

        // Update attribution status to 'rewarded'
        await (supabase as any)
            .from('invite_attributions')
            .update({ status: 'rewarded' })
            .eq('id', attributionId)
            .eq('program_type', 'professional_invite')

        return { success: true, rewardEventId: data?.id }
    } catch (err) {
        console.error('Unexpected error in createInviteRewardEvent:', err)
        return { success: false, error: 'Error inesperado' }
    }
}
