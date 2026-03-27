'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAppUrl } from '@/lib/config/app-url'
import { requireOperationsAction } from '@/lib/admin/guard'
import { logAdminOperation } from '@/lib/admin/operations'
import { createServiceClient } from '@/lib/supabase/service'
import { grantEventEntitlements } from '@/lib/events/entitlements'
import { fulfillOneTimePayment } from '@/lib/payments'
import { syncMembershipEntitlementsForUser } from '@/lib/membership-entitlements'

const MANUAL_SOURCE_TYPES = new Set(['manual', 'support', 'gift', 'alliance', 'migration'])

function getReturnTo(formData: FormData) {
    const returnTo = String(formData.get('returnTo') || '/dashboard/admin/operations')
    return returnTo.startsWith('/') ? returnTo : '/dashboard/admin/operations'
}

function withNotice(path: string, kind: 'success' | 'error', message: string) {
    const url = new URL(path, 'http://localhost')
    url.searchParams.set(kind === 'success' ? 'notice' : 'error', message)
    return `${url.pathname}${url.search}`
}

function normalizeEmail(email: string | null | undefined) {
    const value = email?.trim().toLowerCase()
    return value || null
}

function ensureConfirmation(formData: FormData) {
    const confirmation = String(formData.get('confirmation') || '').trim().toUpperCase()
    if (confirmation !== 'CONFIRMAR') {
        throw new Error('Escribe CONFIRMAR para continuar')
    }
}

async function redirectAfter(action: () => Promise<string>) {
    const destination = await action()
    redirect(destination)
}

export async function sendAccessMagicLinkAction(formData: FormData) {
    await redirectAfter(async () => {
        const { profile: actor } = await requireOperationsAction()
        const returnTo = getReturnTo(formData)
        const email = normalizeEmail(String(formData.get('email') || ''))
        const nextPath = String(formData.get('nextPath') || '/mi-acceso')

        if (!email) {
            return withNotice(returnTo, 'error', 'Correo requerido')
        }

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!url || !anonKey) {
            return withNotice(returnTo, 'error', 'Supabase no esta configurado para enviar magic links')
        }

        const client = createSupabaseClient(url, anonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })

        const { error } = await client.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(nextPath.startsWith('/') ? nextPath : '/mi-acceso')}`,
            },
        })

        if (error) {
            return withNotice(returnTo, 'error', error.message)
        }

        await logAdminOperation({
            actorUserId: actor.id,
            actionType: 'magic_link_sent',
            entityType: 'identity',
            targetEmail: email,
            details: {
                nextPath,
            },
        })

        revalidatePath('/dashboard/admin/operations')
        return withNotice(returnTo, 'success', 'Magic link enviado')
    })
}

export async function addAdminNoteAction(formData: FormData) {
    await redirectAfter(async () => {
        const { profile: actor } = await requireOperationsAction()
        const admin = createServiceClient()
        const returnTo = getReturnTo(formData)
        const entityType = String(formData.get('entityType') || 'identity')
        const entityId = String(formData.get('entityId') || '') || null
        const targetUserId = String(formData.get('targetUserId') || '') || null
        const targetEmail = normalizeEmail(String(formData.get('targetEmail') || ''))
        const note = String(formData.get('note') || '').trim()

        if (!note) {
            return withNotice(returnTo, 'error', 'La nota no puede estar vacia')
        }

        const { error } = await (admin
            .from('admin_operation_notes') as any)
            .insert({
                entity_type: entityType,
                entity_id: entityId,
                target_user_id: targetUserId,
                target_email: targetEmail,
                note,
                created_by: actor.id,
                updated_by: actor.id,
            })

        if (error) {
            return withNotice(returnTo, 'error', error.message)
        }

        await logAdminOperation({
            actorUserId: actor.id,
            actionType: 'note_added',
            entityType,
            entityId,
            targetUserId,
            targetEmail,
        })

        revalidatePath('/dashboard/admin/operations')
        return withNotice(returnTo, 'success', 'Nota guardada')
    })
}

export async function grantEntitlementAction(formData: FormData) {
    await redirectAfter(async () => {
        const { profile: actor } = await requireOperationsAction()
        const admin = createServiceClient()
        const returnTo = getReturnTo(formData)
        const eventId = String(formData.get('eventId') || '')
        const targetUserId = String(formData.get('targetUserId') || '') || null
        const targetEmail = normalizeEmail(String(formData.get('targetEmail') || ''))
        const sourceType = String(formData.get('sourceType') || 'manual')
        const reason = String(formData.get('reason') || '').trim()
        const endsAt = String(formData.get('endsAt') || '').trim() || null

        if (!eventId || !targetEmail) {
            return withNotice(returnTo, 'error', 'Evento y correo son requeridos')
        }

        if (!MANUAL_SOURCE_TYPES.has(sourceType)) {
            return withNotice(returnTo, 'error', 'Origen manual invalido')
        }

        const { data: event } = await (admin
            .from('events') as any)
            .select('id, event_type, recording_expires_at')
            .eq('id', eventId)
            .maybeSingle()

        if (!event) {
            return withNotice(returnTo, 'error', 'Activo no encontrado')
        }

        await grantEventEntitlements({
            event,
            email: targetEmail,
            userId: targetUserId,
            sourceType: sourceType as any,
            sourceReference: `admin:${actor.id}`,
            endsAt,
            metadata: {
                reason: reason || null,
                granted_by: actor.id,
                granted_via: 'admin_operations',
            },
        })

        await logAdminOperation({
            actorUserId: actor.id,
            actionType: 'entitlement_granted',
            entityType: 'event_entitlement',
            entityId: eventId,
            targetUserId,
            targetEmail,
            reason,
            details: {
                sourceType,
                endsAt,
            },
        })

        revalidatePath('/dashboard/admin/operations')
        revalidatePath('/mi-acceso')
        return withNotice(returnTo, 'success', 'Entitlement otorgado')
    })
}

export async function revokeEntitlementAction(formData: FormData) {
    await redirectAfter(async () => {
        const { profile: actor } = await requireOperationsAction()
        const admin = createServiceClient()
        const returnTo = getReturnTo(formData)
        const entitlementId = String(formData.get('entitlementId') || '')
        const reason = String(formData.get('reason') || '').trim()

        if (!entitlementId) {
            return withNotice(returnTo, 'error', 'Entitlement invalido')
        }

        const { data: entitlement } = await (admin
            .from('event_entitlements') as any)
            .select('id, event_id, user_id, email, metadata')
            .eq('id', entitlementId)
            .maybeSingle()

        if (!entitlement) {
            return withNotice(returnTo, 'error', 'Entitlement no encontrado')
        }

        const { error } = await (admin
            .from('event_entitlements') as any)
            .update({
                status: 'revoked',
                revoked_at: new Date().toISOString(),
                metadata: {
                    ...(entitlement.metadata ?? {}),
                    revoked_by: actor.id,
                    revoked_reason: reason || null,
                },
            })
            .eq('id', entitlementId)

        if (error) {
            return withNotice(returnTo, 'error', error.message)
        }

        await logAdminOperation({
            actorUserId: actor.id,
            actionType: 'entitlement_revoked',
            entityType: 'event_entitlement',
            entityId: entitlementId,
            targetUserId: entitlement.user_id,
            targetEmail: entitlement.email,
            reason,
            details: {
                eventId: entitlement.event_id,
            },
        })

        revalidatePath('/dashboard/admin/operations')
        revalidatePath('/mi-acceso')
        return withNotice(returnTo, 'success', 'Entitlement revocado')
    })
}

export async function extendEntitlementAction(formData: FormData) {
    await redirectAfter(async () => {
        const { profile: actor } = await requireOperationsAction()
        const admin = createServiceClient()
        const returnTo = getReturnTo(formData)
        const entitlementId = String(formData.get('entitlementId') || '')
        const endsAt = String(formData.get('endsAt') || '').trim()
        const reason = String(formData.get('reason') || '').trim()

        if (!entitlementId || !endsAt) {
            return withNotice(returnTo, 'error', 'Entitlement y vigencia son requeridos')
        }

        const { data: entitlement } = await (admin
            .from('event_entitlements') as any)
            .select('id, user_id, email, metadata')
            .eq('id', entitlementId)
            .maybeSingle()

        if (!entitlement) {
            return withNotice(returnTo, 'error', 'Entitlement no encontrado')
        }

        const { error } = await (admin
            .from('event_entitlements') as any)
            .update({
                ends_at: endsAt,
                metadata: {
                    ...(entitlement.metadata ?? {}),
                    extended_by: actor.id,
                    extension_reason: reason || null,
                },
            })
            .eq('id', entitlementId)

        if (error) {
            return withNotice(returnTo, 'error', error.message)
        }

        await logAdminOperation({
            actorUserId: actor.id,
            actionType: 'entitlement_extended',
            entityType: 'event_entitlement',
            entityId: entitlementId,
            targetUserId: entitlement.user_id,
            targetEmail: entitlement.email,
            reason,
            details: {
                endsAt,
            },
        })

        revalidatePath('/dashboard/admin/operations')
        revalidatePath('/mi-acceso')
        return withNotice(returnTo, 'success', 'Vigencia actualizada')
    })
}

function buildFulfillmentPayload(purchase: any, transaction: any) {
    return {
        sessionId: purchase.provider_session_id || transaction?.provider_session_id || `manual-retry-${purchase.id}`,
        paymentIntentId: purchase.provider_payment_id || transaction?.provider_payment_id || undefined,
        invoiceId: transaction?.provider_invoice_id || undefined,
        amount: Number(transaction?.amount ?? purchase.amount_paid ?? 0),
        currency: String(transaction?.currency ?? purchase.currency ?? 'MXN'),
        customerEmail: purchase.email,
        metadata: {
            ...(transaction?.metadata ?? {}),
            ...(purchase.metadata ?? {}),
            event_purchase_id: purchase.id,
            buyer_full_name: purchase.full_name ?? '',
            purchase_type: 'event_purchase',
            reference_id: purchase.event_id,
            user_id: purchase.user_id ?? '',
            profile_id: purchase.user_id ?? '',
        },
        purchaseType: 'event_purchase' as const,
        referenceId: purchase.event_id,
    }
}

export async function retryFulfillmentAction(formData: FormData) {
    await redirectAfter(async () => {
        const { profile: actor } = await requireOperationsAction()
        const admin = createServiceClient()
        const returnTo = getReturnTo(formData)
        const purchaseId = String(formData.get('purchaseId') || '')

        if (!purchaseId) {
            return withNotice(returnTo, 'error', 'Compra invalida')
        }

        const { data: purchase } = await (admin
            .from('event_purchases') as any)
            .select('*')
            .eq('id', purchaseId)
            .maybeSingle()

        if (!purchase) {
            return withNotice(returnTo, 'error', 'Compra no encontrada')
        }

        const { data: transaction } = await (admin
            .from('payment_transactions') as any)
            .select('*')
            .or([
                purchase.provider_payment_id ? `provider_payment_id.eq.${purchase.provider_payment_id}` : null,
                purchase.provider_session_id ? `provider_session_id.eq.${purchase.provider_session_id}` : null,
                `email.eq.${purchase.email}`,
            ].filter(Boolean).join(','))
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        const payload = buildFulfillmentPayload(purchase, transaction)
        await fulfillOneTimePayment(payload)

        await logAdminOperation({
            actorUserId: actor.id,
            actionType: 'purchase_fulfillment_retried',
            entityType: 'event_purchase',
            entityId: purchaseId,
            targetUserId: purchase.user_id,
            targetEmail: purchase.email,
            details: {
                providerSessionId: payload.sessionId,
                providerPaymentId: payload.paymentIntentId ?? null,
            },
        })

        revalidatePath('/dashboard/admin/operations')
        revalidatePath('/mi-acceso')
        return withNotice(returnTo, 'success', 'Fulfillment reintentado')
    })
}

export async function relinkPurchaseIdentityAction(formData: FormData) {
    await redirectAfter(async () => {
        const { profile: actor } = await requireOperationsAction()
        const admin = createServiceClient()
        const returnTo = getReturnTo(formData)
        const purchaseId = String(formData.get('purchaseId') || '')
        const targetUserId = String(formData.get('targetUserId') || '')

        if (!purchaseId || !targetUserId) {
            return withNotice(returnTo, 'error', 'Compra y persona destino son requeridas')
        }

        const [{ data: purchase }, { data: targetProfile }] = await Promise.all([
            (admin
                .from('event_purchases') as any)
                .select('*')
                .eq('id', purchaseId)
                .maybeSingle(),
            (admin
                .from('profiles') as any)
                .select('id, email, full_name')
                .eq('id', targetUserId)
                .maybeSingle(),
        ])

        if (!purchase || !targetProfile?.email) {
            return withNotice(returnTo, 'error', 'No fue posible resolver la compra o la identidad destino')
        }

        const oldEmail = normalizeEmail(purchase.email)
        const newEmail = normalizeEmail(targetProfile.email)

        await (admin
            .from('event_purchases') as any)
            .update({
                user_id: targetProfile.id,
                email: newEmail,
                full_name: purchase.full_name || targetProfile.full_name || null,
            })
            .eq('id', purchaseId)

        await (admin
            .from('payment_transactions') as any)
            .update({
                user_id: targetProfile.id,
                profile_id: targetProfile.id,
                email: newEmail,
            })
            .or([
                purchase.provider_payment_id ? `provider_payment_id.eq.${purchase.provider_payment_id}` : null,
                purchase.provider_session_id ? `provider_session_id.eq.${purchase.provider_session_id}` : null,
                oldEmail ? `email.eq.${oldEmail}` : null,
            ].filter(Boolean).join(','))

        await (admin
            .from('event_entitlements') as any)
            .update({
                user_id: targetProfile.id,
                email: newEmail,
            })
            .or([
                `source_reference.eq.${purchaseId}`,
                oldEmail ? `identity_key.eq.${oldEmail}` : null,
            ].filter(Boolean).join(','))

        await logAdminOperation({
            actorUserId: actor.id,
            actionType: 'purchase_relinked',
            entityType: 'event_purchase',
            entityId: purchaseId,
            targetUserId: targetProfile.id,
            targetEmail: newEmail,
            details: {
                previousEmail: oldEmail,
            },
        })

        await fulfillOneTimePayment(
            buildFulfillmentPayload(
                {
                    ...purchase,
                    user_id: targetProfile.id,
                    email: newEmail,
                },
                null
            )
        )

        revalidatePath('/dashboard/admin/operations')
        revalidatePath('/mi-acceso')
        return withNotice(returnTo, 'success', 'Compra vinculada a la identidad correcta')
    })
}

export async function mergeCommerceIdentityAction(formData: FormData) {
    await redirectAfter(async () => {
        const { profile: actor } = await requireOperationsAction()
        const admin = createServiceClient()
        const returnTo = getReturnTo(formData)
        const sourceUserId = String(formData.get('sourceUserId') || '') || null
        const sourceEmail = normalizeEmail(String(formData.get('sourceEmail') || ''))
        const targetUserId = String(formData.get('targetUserId') || '')

        ensureConfirmation(formData)

        if (!targetUserId || (!sourceUserId && !sourceEmail)) {
            return withNotice(returnTo, 'error', 'Origen y destino son requeridos para fusionar')
        }

        const { data: targetProfile } = await (admin
            .from('profiles') as any)
            .select('id, email')
            .eq('id', targetUserId)
            .maybeSingle()

        if (!targetProfile?.email) {
            return withNotice(returnTo, 'error', 'Perfil destino no encontrado')
        }

        const targetEmail = normalizeEmail(targetProfile.email)

        if (sourceUserId) {
            await (admin
                .from('event_purchases') as any)
                .update({
                    user_id: targetUserId,
                    email: targetEmail,
                })
                .eq('user_id', sourceUserId)

            await (admin
                .from('event_entitlements') as any)
                .update({
                    user_id: targetUserId,
                    email: targetEmail,
                })
                .eq('user_id', sourceUserId)

            await (admin
                .from('payment_transactions') as any)
                .update({
                    user_id: targetUserId,
                    profile_id: targetUserId,
                    email: targetEmail,
                })
                .or(`user_id.eq.${sourceUserId},profile_id.eq.${sourceUserId}`)

            await (admin
                .from('subscriptions') as any)
                .update({
                    user_id: targetUserId,
                    profile_id: targetUserId,
                })
                .or(`user_id.eq.${sourceUserId},profile_id.eq.${sourceUserId}`)

            const { data: sourceRegistrations } = await (admin
                .from('event_registrations') as any)
                .select('id, event_id')
                .eq('user_id', sourceUserId)

            for (const row of sourceRegistrations ?? []) {
                const { data: existingTarget } = await (admin
                    .from('event_registrations') as any)
                    .select('id')
                    .eq('event_id', row.event_id)
                    .eq('user_id', targetUserId)
                    .maybeSingle()

                if (existingTarget) {
                    await (admin
                        .from('event_registrations') as any)
                        .delete()
                        .eq('id', row.id)
                } else {
                    await (admin
                        .from('event_registrations') as any)
                        .update({ user_id: targetUserId })
                        .eq('id', row.id)
                }
            }
        }

        if (sourceEmail) {
            await (admin
                .from('event_purchases') as any)
                .update({
                    user_id: targetUserId,
                    email: targetEmail,
                })
                .eq('email', sourceEmail)

            await (admin
                .from('event_entitlements') as any)
                .update({
                    user_id: targetUserId,
                    email: targetEmail,
                })
                .eq('identity_key', sourceEmail)

            await (admin
                .from('payment_transactions') as any)
                .update({
                    user_id: targetUserId,
                    profile_id: targetUserId,
                    email: targetEmail,
                })
                .eq('email', sourceEmail)
        }

        await syncMembershipEntitlementsForUser(targetUserId)

        await logAdminOperation({
            actorUserId: actor.id,
            actionType: 'commerce_identity_merged',
            entityType: 'identity',
            entityId: sourceUserId ?? sourceEmail,
            targetUserId,
            targetEmail,
            details: {
                sourceUserId,
                sourceEmail,
            },
        })

        revalidatePath('/dashboard/admin/operations')
        revalidatePath('/mi-acceso')
        return withNotice(returnTo, 'success', 'Identidad comercial fusionada')
    })
}

export async function regenerateMembershipEntitlementsAction(formData: FormData) {
    await redirectAfter(async () => {
        const { profile: actor } = await requireOperationsAction()
        const returnTo = getReturnTo(formData)
        const userId = String(formData.get('userId') || '')

        if (!userId) {
            return withNotice(returnTo, 'error', 'Persona requerida')
        }

        const result = await syncMembershipEntitlementsForUser(userId)

        await logAdminOperation({
            actorUserId: actor.id,
            actionType: 'membership_entitlements_regenerated',
            entityType: 'membership',
            entityId: userId,
            targetUserId: userId,
            details: {
                granted: result.granted,
                revoked: result.revoked,
                accessActive: result.accessActive,
                ruleIds: result.rules.map((rule) => rule.id),
            },
        })

        revalidatePath('/dashboard/admin/operations')
        revalidatePath('/mi-acceso')
        return withNotice(returnTo, 'success', `Regeneracion completada (${result.granted} grants, ${result.revoked} revocados)`)
    })
}
