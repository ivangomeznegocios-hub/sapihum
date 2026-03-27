'use server'

import { createClient } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
import { revalidatePath } from 'next/cache'
import type { TargetAudience } from '@/types/database'
import {
    getEffectiveEventPriceForProfile,
    normalizeMemberAccessType,
} from '@/lib/events/pricing'
import { getUniqueEventAccessCount } from '@/lib/events/attendance'
import { grantEventEntitlements } from '@/lib/events/entitlements'
import { slugifyCatalogText } from '@/lib/events/public'
import { audienceAllowsAccess, getCommercialAccessContext } from '@/lib/access/commercial'

async function resolveUniqueEventSlug(supabase: any, baseValue: string, eventId?: string) {
    const fallbackBase = slugifyCatalogText(baseValue) || `evento-${crypto.randomUUID().slice(0, 8)}`
    let candidate = fallbackBase
    let suffix = 2

    while (true) {
        let query = (supabase
            .from('events') as any)
            .select('id')
            .eq('slug', candidate)
            .limit(1)

        if (eventId) {
            query = query.neq('id', eventId)
        }

        const { data: existing } = await query.maybeSingle()
        if (!existing) {
            return candidate
        }

        candidate = `${fallbackBase}-${suffix}`
        suffix += 1
    }
}

export async function registerForEvent(eventId: string, registrationData: Record<string, string> = {}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Get event to check audience requirements and pricing
    const { data: event } = await (supabase
        .from('events') as any)
        .select('target_audience, required_subscription, max_attendees, price, member_access_type, member_price, event_type, recording_expires_at')
        .eq('id', eventId)
        .single()

    if (!event) {
        return { error: 'Evento no encontrado' }
    }

    // Get user profile
    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role, membership_level, subscription_status, email')
        .eq('id', user.id)
        .single()

    const profileData = profile ? (profile as any) : null
    const commercialAccess = profileData
        ? await getCommercialAccessContext({
            supabase,
            userId: user.id,
            profile: profileData,
        })
        : null
    const audience = (event as any).target_audience as TargetAudience[] || ['public']
    const hasAccess = commercialAccess
        ? audienceAllowsAccess(audience, commercialAccess)
        : audience.includes('public')

    if (!hasAccess) {
        return { error: 'No tienes acceso a este evento' }
    }

    const eventData = event as any
    let currentPrice = eventData.price || 0
    let needsToPay = false

    if (profileData) {
        currentPrice = getEffectiveEventPriceForProfile(
            {
                price: eventData.price,
                member_price: eventData.member_price,
                member_access_type: normalizeMemberAccessType(eventData.member_access_type),
            },
            {
                role: profileData.role,
                membershipLevel: commercialAccess?.membershipLevel ?? profileData.membership_level ?? 0,
                hasActiveMembership: commercialAccess?.hasActiveMembership ?? false,
            }
        )

        if (profileData.role !== 'admin' && currentPrice > 0) {
            needsToPay = true
        }
    } else if (currentPrice > 0) {
        needsToPay = true
    }

    if (needsToPay) {
        return { error: 'Este evento requiere pago. Utiliza el botón de compra para inscribirte.' }
    }

    // Check if already registered
    const { data: existing } = await (supabase
        .from('event_registrations') as any)
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

    if (existing) {
        return { error: 'Ya estás registrado en este evento' }
    }

    // Check max attendees
    if (eventData.max_attendees) {
        const attendeeCount = await getUniqueEventAccessCount(supabase, eventId)

        if (attendeeCount >= eventData.max_attendees) {
            return { error: 'El evento está lleno' }
        }
    }

    const { error } = await (supabase as any)
        .from('event_registrations' as any)
        .insert({
            event_id: eventId,
            user_id: user.id,
            status: 'registered',
            registration_data: registrationData
        })

    if (error) {
        return { error: error.message }
    }

    if (profileData?.email) {
        await grantEventEntitlements({
            event: {
                id: eventId,
                event_type: eventData.event_type || 'live',
                recording_expires_at: eventData.recording_expires_at || null,
            } as any,
            email: profileData.email,
            userId: user.id,
            sourceType: currentPrice === 0 && Number(eventData.price || 0) > 0 ? 'membership' : 'registration',
            metadata: {
                registration_data: registrationData,
            },
        })
    }

    await recordAnalyticsServerEvent({
        eventName: 'event_registered',
        eventSource: 'server',
        userId: user.id,
        touch: {
            funnel: 'event',
        },
        properties: {
            eventId,
            registrationType: 'free',
        },
    })

    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
}

export async function cancelEventRegistration(eventId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const { error } = await (supabase
        .from('event_registrations') as any)
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    if (error) {
        return { error: error.message }
    }

    await (supabase
        .from('event_entitlements') as any)
        .update({ status: 'revoked' })
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('source_type', 'registration')

    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
}

export async function createEvent(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify user is admin or psychologist
    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'ponente'].includes(profile.role)) {
        return { error: 'No tienes permisos para crear eventos' }
    }

    const title = formData.get('title') as string
    const customSlug = (formData.get('slug') as string | null)?.trim() || null
    const subtitle = (formData.get('subtitle') as string | null)?.trim() || null
    const description = formData.get('description') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const duration = parseInt(formData.get('duration') as string) || 60
    const eventType = formData.get('eventType') as string || 'live'
    const maxAttendees = parseInt(formData.get('maxAttendees') as string) || null
    const meetingLink = formData.get('meetingLink') as string || null
    const imageUrl = formData.get('imageUrl') as string || null
    const price = parseFloat(formData.get('price') as string) || 0
    const recordingDays = Math.min(30, Math.max(7, parseInt(formData.get('recordingDays') as string) || 15))
    const location = formData.get('location') as string || null

    // Parse session configuration
    const sessionConfigRaw = formData.get('sessionConfig') as string
    let sessionConfig = null
    try {
        if (sessionConfigRaw) sessionConfig = JSON.parse(sessionConfigRaw)
    } catch { /* ignore */ }

    // Parse target audience from checkboxes
    const audienceRaw = formData.getAll('audience') as string[]
    const targetAudience = audienceRaw.length > 0 ? audienceRaw : ['public']

    // Parse registration fields (custom questions)
    const registrationFieldsRaw = formData.get('registrationFields') as string
    let registrationFields: any[] = []
    try {
        registrationFields = registrationFieldsRaw ? JSON.parse(registrationFieldsRaw) : []
    } catch {
        registrationFields = []
    }

    if (!title || !date || !time) {
        return { error: 'Faltan campos requeridos' }
    }

    const startTime = new Date(`${date}T${time}`)
    const endTime = new Date(startTime.getTime() + duration * 60000)

    const memberPrice = parseFloat(formData.get('memberPrice') as string) || 0
    const memberAccessType = (formData.get('memberAccessType') as string) || 'free'
    const isEmbeddable = formData.get('isEmbeddable') === 'on'
    const ogDescription = formData.get('ogDescription') as string || null
    const seoTitle = formData.get('seoTitle') as string || null
    const seoDescription = formData.get('seoDescription') as string || null
    const heroBadge = formData.get('heroBadge') as string || null
    const publicCtaLabel = formData.get('publicCtaLabel') as string || null

    const slug = await resolveUniqueEventSlug(supabase, customSlug || title)

    const { data: newEvent, error } = await (supabase
        .from('events') as any)
        .insert({
            slug,
            title,
            subtitle,
            description: description || null,
            image_url: imageUrl,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            event_type: eventType,
            status: profile.role === 'admin' ? 'upcoming' : 'draft',
            meeting_link: meetingLink,
            max_attendees: maxAttendees,
            price,
            member_price: memberPrice,
            member_access_type: memberAccessType,
            is_embeddable: isEmbeddable,
            og_description: ogDescription,
            seo_title: seoTitle,
            seo_description: seoDescription,
            hero_badge: heroBadge,
            public_cta_label: publicCtaLabel,
            target_audience: targetAudience,
            registration_fields: registrationFields,
            recording_available_days: recordingDays,
            is_members_only: targetAudience.includes('members'),
            created_by: user.id,
            category: (formData.get('category') as string) || 'general',
            subcategory: (formData.get('subcategory') as string) || null,
            session_config: sessionConfig,
            location,
        })
        .select('id')
        .single()

    if (error) {
        return { error: error.message }
    }

    // Handle speaker assignments
    const speakerIdsRaw = formData.get('speakerIds') as string
    if (speakerIdsRaw && newEvent) {
        try {
            const speakerIds = JSON.parse(speakerIdsRaw) as string[]
            for (let i = 0; i < speakerIds.length; i++) {
                await (supabase.from('event_speakers') as any)
                    .insert({
                        event_id: newEvent.id,
                        speaker_id: speakerIds[i],
                        display_order: i
                    })
            }
        } catch { /* ignore parse errors */ }
    }

    revalidatePath('/dashboard/events')
    return { success: true }
}

export async function updateEvent(eventId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify user is admin or event creator
    const { data: event } = await (supabase
        .from('events') as any)
        .select('created_by')
        .eq('id', eventId)
        .single()

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (!event || (event.created_by !== user.id && profile?.role !== 'admin')) {
        return { error: 'No tienes permisos para editar este evento' }
    }

    const title = formData.get('title') as string
    const customSlug = (formData.get('slug') as string | null)?.trim() || null
    const subtitle = (formData.get('subtitle') as string | null)?.trim() || null
    const description = formData.get('description') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const duration = parseInt(formData.get('duration') as string) || 60
    const eventType = formData.get('eventType') as string
    const maxAttendees = parseInt(formData.get('maxAttendees') as string) || null
    const meetingLink = formData.get('meetingLink') as string
    const imageUrl = formData.get('imageUrl') as string
    const price = parseFloat(formData.get('price') as string) || 0
    const recordingDays = Math.min(30, Math.max(7, parseInt(formData.get('recordingDays') as string) || 15))
    const recordingUrl = formData.get('recordingUrl') as string
    const status = formData.get('status') as string
    const location = formData.get('location') as string

    // Parse session configuration
    const sessionConfigRaw = formData.get('sessionConfig') as string
    let sessionConfig: any = undefined
    try {
        if (sessionConfigRaw) sessionConfig = JSON.parse(sessionConfigRaw)
    } catch { /* ignore */ }

    // Parse target audience from checkboxes
    const audienceRaw = formData.getAll('audience') as string[]
    const targetAudience = audienceRaw.length > 0 ? audienceRaw : undefined

    // Parse registration fields (custom questions)
    const registrationFieldsRaw = formData.get('registrationFields') as string
    let registrationFields: any[] | undefined = undefined
    try {
        registrationFields = registrationFieldsRaw ? JSON.parse(registrationFieldsRaw) : undefined
    } catch {
        registrationFields = undefined
    }

    const updates: Record<string, any> = {}

    if (title) updates.title = title
    if (description !== undefined) updates.description = description || null
    if (imageUrl !== undefined) updates.image_url = imageUrl || null

    if (date && time) {
        const startTime = new Date(`${date}T${time}`)
        const endTime = new Date(startTime.getTime() + duration * 60000)
        updates.start_time = startTime.toISOString()
        updates.end_time = endTime.toISOString()
    }

    if (eventType) updates.event_type = eventType
    // Only admins can change status from draft. 
    // If a non-admin (ponente) edits the event, it must always revert to draft for review.
    if (profile?.role === 'admin') {
        if (status) updates.status = status
    } else {
        updates.status = 'draft'
    }
    if (meetingLink !== undefined) updates.meeting_link = meetingLink || null
    if (maxAttendees !== undefined) updates.max_attendees = maxAttendees || null
    if (price !== undefined) updates.price = price
    if (targetAudience) updates.target_audience = targetAudience
    if (registrationFields !== undefined) updates.registration_fields = registrationFields
    if (recordingDays !== undefined) updates.recording_available_days = recordingDays
    if (recordingUrl !== undefined) updates.recording_url = recordingUrl || null
    if (sessionConfig !== undefined) updates.session_config = sessionConfig
    if (location !== undefined) updates.location = location || null

    if (targetAudience) {
        updates.is_members_only = targetAudience.includes('members')
    }

    // Category and subcategory
    const category = formData.get('category') as string
    const subcategory = formData.get('subcategory') as string
    if (category) updates.category = category
    if (subcategory !== undefined) updates.subcategory = subcategory || null

    // New pricing/embed fields
    const memberPrice = formData.get('memberPrice') as string
    const memberAccessType = formData.get('memberAccessType') as string
    const isEmbeddable = formData.get('isEmbeddable')
    const ogDescription = formData.get('ogDescription') as string
    const seoTitle = formData.get('seoTitle') as string
    const seoDescription = formData.get('seoDescription') as string
    const heroBadge = formData.get('heroBadge') as string
    const publicCtaLabel = formData.get('publicCtaLabel') as string

    if (memberPrice !== null) updates.member_price = parseFloat(memberPrice) || 0
    if (memberAccessType) updates.member_access_type = memberAccessType
    if (isEmbeddable !== null) updates.is_embeddable = isEmbeddable === 'on'
    if (ogDescription !== undefined) updates.og_description = ogDescription || null
    if (seoTitle !== undefined) updates.seo_title = seoTitle || null
    if (seoDescription !== undefined) updates.seo_description = seoDescription || null
    if (heroBadge !== undefined) updates.hero_badge = heroBadge || null
    if (publicCtaLabel !== undefined) updates.public_cta_label = publicCtaLabel || null
    if (subtitle !== undefined) updates.subtitle = subtitle || null
    if (customSlug !== null) {
        const normalizedSlug = slugifyCatalogText(customSlug)
        if (normalizedSlug) {
            updates.slug = await resolveUniqueEventSlug(supabase, normalizedSlug, eventId)
        }
    }

    const { error } = await (supabase
        .from('events') as any)
        .update(updates)
        .eq('id', eventId)

    if (error) {
        return { error: error.message }
    }

    // Handle speaker assignments on update
    const speakerIdsRaw = formData.get('speakerIds') as string
    if (speakerIdsRaw) {
        try {
            const speakerIds = JSON.parse(speakerIdsRaw) as string[]

            // Delete existing speakers
            await (supabase.from('event_speakers') as any)
                .delete()
                .eq('event_id', eventId)

            // Insert new ones
            for (let i = 0; i < speakerIds.length; i++) {
                await (supabase.from('event_speakers') as any)
                    .insert({
                        event_id: eventId,
                        speaker_id: speakerIds[i],
                        display_order: i
                    })
            }
        } catch { /* ignore parse errors */ }
    }

    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
}

export async function deleteEvent(eventId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify user is admin or event creator
    const { data: event } = await (supabase
        .from('events') as any)
        .select('created_by')
        .eq('id', eventId)
        .single()

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (!event || (event.created_by !== user.id && profile?.role !== 'admin')) {
        return { error: 'No tienes permisos para eliminar este evento' }
    }

    const { error } = await (supabase
        .from('events') as any)
        .delete()
        .eq('id', eventId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/events')
    return { success: true }
}

export async function addSpeakerToEvent(eventId: string, speakerId: string, role: string = 'speaker') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const [{ data: event }, { data: profile }] = await Promise.all([
        (supabase.from('events') as any).select('created_by').eq('id', eventId).single(),
        (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    ])

    if (!event || (event.created_by !== user.id && profile?.role !== 'admin')) {
        return { error: 'No tienes permisos para modificar este evento' }
    }

    const { error } = await (supabase.from('event_speakers') as any)
        .insert({ event_id: eventId, speaker_id: speakerId, role })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
}

export async function removeSpeakerFromEvent(eventId: string, speakerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const [{ data: event }, { data: profile }] = await Promise.all([
        (supabase.from('events') as any).select('created_by').eq('id', eventId).single(),
        (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    ])

    if (!event || (event.created_by !== user.id && profile?.role !== 'admin')) {
        return { error: 'No tienes permisos para modificar este evento' }
    }

    const { error } = await (supabase.from('event_speakers') as any)
        .delete()
        .eq('event_id', eventId)
        .eq('speaker_id', speakerId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
}

export async function createEventPurchase(eventId: string, email: string, fullName: string) {
    const supabase = await createClient()

    // Get event price
    const { data: event } = await (supabase.from('events') as any)
        .select('price, title')
        .eq('id', eventId)
        .single()

    if (!event) return { error: 'Evento no encontrado' }

    const { data: purchase, error } = await (supabase.from('event_purchases') as any)
        .insert({
            event_id: eventId,
            email,
            full_name: fullName,
            amount_paid: event.price,
            status: 'pending'
        })
        .select('id, access_token')
        .single()

    if (error) return { error: error.message }

    return { success: true, purchase }
}
