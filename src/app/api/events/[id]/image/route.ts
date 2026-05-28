import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { destroyCloudinaryImage, getCloudinaryCloudName } from '@/lib/cloudinary/server'
import {
    canUpdateEventImage,
    getEventImagePublicIdPrefix,
    validateCloudinaryEventImageResult,
    type CloudinaryEventImageResult,
} from '@/lib/events/image-upload'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
    params: Promise<{ id: string }>
}

type ConfirmEventImageBody = CloudinaryEventImageResult & {
    alt_text?: unknown
}

function normalizeAltText(value: unknown) {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    if (!trimmed) return null
    return trimmed.slice(0, 180)
}

export async function POST(request: Request, context: RouteContext) {
    let newPublicId: string | null = null

    try {
        const { id: eventId } = await context.params
        const body = await request.json() as ConfirmEventImageBody
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const { data: profile, error: profileError } = await (supabase
            .from('profiles') as any)
            .select('id, role')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
        }

        const serviceSupabase = createServiceClient()
        const { data: event, error: eventError } = await (serviceSupabase
            .from('events') as any)
            .select('id, slug, status, created_by, image_public_id')
            .eq('id', eventId)
            .maybeSingle()

        if (eventError) {
            console.error('[EventImageUpload] Failed to load event for confirmation:', eventError)
            return NextResponse.json({ error: 'No fue posible cargar el evento' }, { status: 500 })
        }

        if (!event) {
            return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
        }

        const allowed = await canUpdateEventImage({
            supabase: serviceSupabase,
            event,
            profile,
            userId: user.id,
        })

        if (!allowed) {
            return NextResponse.json({ error: 'No tienes permisos para cambiar la imagen de este evento' }, { status: 403 })
        }

        const validation = validateCloudinaryEventImageResult({
            result: body,
            eventId,
            cloudName: getCloudinaryCloudName(),
        })

        if ('error' in validation) {
            const rejectedPublicId = typeof body.public_id === 'string' ? body.public_id.trim() : ''
            if (rejectedPublicId.startsWith(getEventImagePublicIdPrefix(eventId))) {
                try {
                    await destroyCloudinaryImage(rejectedPublicId)
                } catch (destroyError) {
                    console.error('[EventImageUpload] Failed to destroy rejected Cloudinary image:', destroyError)
                }
            }

            return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        newPublicId = validation.data.publicId
        const oldPublicId = typeof event.image_public_id === 'string' ? event.image_public_id : null
        const imageUpdatedAt = new Date().toISOString()
        const { data: updatedEvent, error: updateError } = await (serviceSupabase
            .from('events') as any)
            .update({
                image_url: validation.data.secureUrl,
                image_public_id: validation.data.publicId,
                image_alt_text: normalizeAltText(body.alt_text),
                image_updated_at: imageUpdatedAt,
            })
            .eq('id', eventId)
            .select('id, slug, image_url, image_public_id, image_alt_text, image_updated_at')
            .maybeSingle()

        if (updateError || !updatedEvent) {
            try {
                await destroyCloudinaryImage(newPublicId)
            } catch (destroyError) {
                console.error('[EventImageUpload] Failed to destroy new image after Supabase failure:', destroyError)
            }

            console.error('[EventImageUpload] Failed to update event image:', updateError)
            return NextResponse.json({ error: 'No fue posible guardar la imagen en el evento' }, { status: 500 })
        }

        if (oldPublicId && oldPublicId !== validation.data.publicId) {
            try {
                await destroyCloudinaryImage(oldPublicId)
            } catch (destroyError) {
                console.error('[EventImageUpload] Failed to destroy previous event image:', destroyError)
            }
        }

        revalidateTag('public-events', 'max')
        revalidatePath('/eventos')
        if (updatedEvent.slug) {
            revalidatePath(`/eventos/${updatedEvent.slug}`)
        }
        revalidatePath(`/dashboard/events/${eventId}`)

        return NextResponse.json({
            imageUrl: updatedEvent.image_url,
            imagePublicId: updatedEvent.image_public_id,
            imageAltText: updatedEvent.image_alt_text,
            imageUpdatedAt: updatedEvent.image_updated_at,
        })
    } catch (error) {
        if (newPublicId) {
            try {
                await destroyCloudinaryImage(newPublicId)
            } catch (destroyError) {
                console.error('[EventImageUpload] Failed to destroy new image after unexpected error:', destroyError)
            }
        }

        console.error('[EventImageUpload] Confirmation error:', error)
        return NextResponse.json({ error: 'No fue posible confirmar la imagen del evento' }, { status: 500 })
    }
}
