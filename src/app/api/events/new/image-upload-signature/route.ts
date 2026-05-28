import { NextResponse } from 'next/server'
import { createEventImageSignature } from '@/lib/cloudinary/server'
import {
    EVENT_IMAGE_ALLOWED_FORMATS,
    EVENT_IMAGE_ALLOWED_MIME_TYPES,
    EVENT_IMAGE_MAX_BYTES,
} from '@/lib/events/image-upload'
import { canCreateEvent } from '@/lib/events/permissions'
import { createClient } from '@/lib/supabase/server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null)
        const eventId = typeof body?.eventId === 'string' ? body.eventId.trim() : ''

        if (!UUID_PATTERN.test(eventId)) {
            return NextResponse.json({ error: 'ID de evento invalido' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const { data: profile, error: profileError } = await (supabase
            .from('profiles') as any)
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
        }

        if (!canCreateEvent(profile.role)) {
            return NextResponse.json({ error: 'No tienes permisos para crear eventos' }, { status: 403 })
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
        console.error('[EventImageUpload] New event signature error:', error)
        return NextResponse.json({ error: 'No fue posible preparar la subida de imagen' }, { status: 500 })
    }
}
