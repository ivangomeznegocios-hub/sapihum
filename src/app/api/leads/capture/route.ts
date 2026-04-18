import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recordAnalyticsServerEvent, resolveAttributionSnapshot } from '@/lib/analytics/server'
import { getAppUrl } from '@/lib/config/app-url'
import { sendEmail } from '@/lib/email/index'
import { buildCampaignLeadMagnetEmail } from '@/lib/email/templates'
import {
    buildCampaignTemarioPath,
    getCampaignPrimaryEvent,
    getCampaignPrimaryEventPath,
    getEventCampaignByKey,
    getEventCampaignBySlug,
    getEventCampaignEventBySlug,
} from '@/lib/events/campaigns'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const LeadCaptureSchema = z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email(),
    whatsapp: z.string().trim().max(40).optional().or(z.literal('')),
    eventId: z.string().uuid().optional(),
    eventSlug: z.string().trim().optional(),
    formationTrack: z.string().trim().optional(),
    sourceSurface: z.string().trim().min(2),
    sourceAction: z.string().trim().default('download_syllabus'),
    assetKey: z.enum(['forense', 'memoria']),
    analyticsContext: z.any().optional().nullable(),
})

export async function POST(request: NextRequest) {
    try {
        const payload = LeadCaptureSchema.safeParse(await request.json())
        if (!payload.success) {
            return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
        }

        const supabase = await createClient()
        const admin = await createAdminClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        const data = payload.data
        const campaign =
            getEventCampaignByKey(data.assetKey) ??
            getEventCampaignBySlug(data.eventSlug ?? null)

        if (!campaign) {
            return NextResponse.json({ error: 'No encontramos el bloque solicitado' }, { status: 404 })
        }

        let resolvedEventId = data.eventId ?? null
        let resolvedEventSlug = data.eventSlug ?? null
        let resolvedEventTitle = resolvedEventSlug
            ? getEventCampaignEventBySlug(resolvedEventSlug)?.title ?? null
            : null

        if (data.eventId || data.eventSlug) {
            let query = (admin.from('events') as any)
                .select('id, slug, title')

            if (data.eventId) {
                query = query.eq('id', data.eventId)
            } else if (data.eventSlug) {
                query = query.eq('slug', data.eventSlug)
            }

            const { data: eventRow } = await query.maybeSingle()
            if (eventRow) {
                resolvedEventId = eventRow.id
                resolvedEventSlug = eventRow.slug
                resolvedEventTitle = eventRow.title
            }
        }

        const attributionSnapshot = await resolveAttributionSnapshot(data.analyticsContext ?? undefined)
        const primaryEvent = getCampaignPrimaryEvent(campaign)
        const primaryEventPath = getCampaignPrimaryEventPath(campaign)
        const speakerRef =
            typeof data.analyticsContext?.touch?.ref === 'string'
                ? data.analyticsContext.touch.ref
                : null

        const leadRow = {
            user_id: user?.id ?? null,
            event_id: resolvedEventId,
            event_slug: resolvedEventSlug,
            formation_track: data.formationTrack || campaign.formationTrack,
            source_surface: data.sourceSurface,
            source_action: data.sourceAction,
            name: data.name,
            email: data.email.trim().toLowerCase(),
            whatsapp: data.whatsapp?.trim() || null,
            speaker_ref: speakerRef,
            lead_tag: campaign.leadTag,
            status: 'captured',
            attribution_snapshot: attributionSnapshot,
            metadata: {
                asset_key: campaign.key,
                event_title: resolvedEventTitle,
                analytics: data.analyticsContext ?? null,
            },
        }

        const { error: leadError } = await (admin.from('event_interest_leads') as any).upsert(leadRow, {
            onConflict: 'contact_key,interest_key,source_action',
        })

        if (leadError) {
            console.error('[Leads] capture insert failed:', leadError)
            return NextResponse.json({ error: 'No fue posible guardar el lead' }, { status: 500 })
        }

        await recordAnalyticsServerEvent({
            eventName: 'generate_lead',
            eventSource: 'server',
            visitorId: data.analyticsContext?.visitorId ?? null,
            sessionId: data.analyticsContext?.sessionId ?? null,
            userId: user?.id ?? null,
            consent: data.analyticsContext?.consent ?? null,
            touch: data.analyticsContext?.touch ?? {
                funnel: 'event',
            },
            properties: {
                assetKey: campaign.key,
                formationTrack: campaign.formationTrack,
                leadTag: campaign.leadTag,
                eventId: resolvedEventId,
                eventSlug: resolvedEventSlug,
                sourceSurface: data.sourceSurface,
                sourceAction: data.sourceAction,
                speakerRef,
            },
        })

        try {
            const appUrl = getAppUrl()
            const temarioUrl = `${appUrl}${buildCampaignTemarioPath(campaign.key)}`
            const relatedEvents = campaign.events.map((event) => ({
                title: event.title,
                url: `${appUrl}/eventos/${event.slug}`,
            }))

            const emailContent = buildCampaignLeadMagnetEmail({
                userName: data.name,
                campaignTitle: campaign.title,
                temarioUrl,
                primaryEventTitle: resolvedEventTitle || primaryEvent.title,
                primaryEventUrl: `${appUrl}${resolvedEventSlug ? `/eventos/${resolvedEventSlug}` : primaryEventPath}`,
                relatedEvents,
            })

            await sendEmail({
                to: data.email,
                subject: emailContent.subject,
                html: emailContent.html,
            })
        } catch (emailError) {
            console.error('[Leads] lead magnet email failed:', emailError)
        }

        return NextResponse.json({
            success: true,
            downloadUrl: buildCampaignTemarioPath(campaign.key),
            redirectUrl: resolvedEventSlug ? `/eventos/${resolvedEventSlug}` : primaryEventPath,
        })
    } catch (error) {
        console.error('[Leads] capture error:', error)
        return NextResponse.json({ error: 'No fue posible procesar la solicitud' }, { status: 500 })
    }
}
