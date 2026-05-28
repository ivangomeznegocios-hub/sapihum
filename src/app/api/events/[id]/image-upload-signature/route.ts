import { NextResponse } from 'next/server'
import { createEventImageSignature } from '@/lib/cloudinary/server'
import {
    canUpdateEventImage,
    EVENT_IMAGE_ALLOWED_FORMATS,
    EVENT_IMAGE_ALLOWED_MIME_TYPES,
    EVENT_IMAGE_MAX_BYTES,
} from '@/lib/events/image-upload'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
    try {
        const { id: eventId } = await context.params
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
            .select('id, status, created_by')
            .eq('id', eventId)
            .maybeSingle()

        if (eventError) {
            console.error('[EventImageUpload] Failed to load event for signature:', eventError)
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

        const signature = createEventImageSignature({ eventId })

        return NextResponse.json({
            cloudName: signature.cloudName,
            apiKey: signature.apiKey,
            timestamp: signature.timestamp,
            signature: signature.signature,
            folder: signature.folder,
            publicId: signature.publicId,
            resourceType: signature.resourceType,
            allowedFormats: [...EVENT_IMAGE_ALLOWED_FORMATS],
            allowedFormatsParam: signature.allowedFormatsParam,
            allowedMimeTypes: [...EVENT_IMAGE_ALLOWED_MIME_TYPES],
            maxBytes: EVENT_IMAGE_MAX_BYTES,
        })
    } catch (error) {
        console.error('[EventImageUpload] Signature error:', error)
        return NextResponse.json({ error: 'No fue posible preparar la subida de imagen' }, { status: 500 })
    }
}
