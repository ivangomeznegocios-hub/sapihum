import 'server-only'

import { canManageAnyEvent } from '@/lib/events/permissions'
import type { EventStatus, UserRole } from '@/types/database'

export const EVENT_IMAGE_MAX_BYTES = 4 * 1024 * 1024
export const EVENT_IMAGE_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const EVENT_IMAGE_ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'] as const
const EVENT_IMAGE_BLOCKED_FORMATS = ['svg', 'mp4', 'mov', 'avi', 'webm', 'mkv'] as const

type EventImagePermissionEvent = {
    id: string
    status: EventStatus | string
    created_by: string | null
}

type EventImagePermissionProfile = {
    id: string
    role: UserRole | string | null
}

export function getEventImagePublicIdPrefix(eventId: string) {
    return `sapihum/events/${eventId}/images/`
}

export function getEventImageSecureUrlPrefix(cloudName: string) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/`
}

export function isAllowedEventImageMimeType(value?: string | null) {
    return EVENT_IMAGE_ALLOWED_MIME_TYPES.includes(value as any)
}

export function isAllowedEventImageFormat(value?: string | null) {
    const normalized = value?.toLowerCase().trim()
    return EVENT_IMAGE_ALLOWED_FORMATS.includes(normalized as any)
}

export function isBlockedEventImageFormat(value?: string | null) {
    const normalized = value?.toLowerCase().trim()
    return EVENT_IMAGE_BLOCKED_FORMATS.includes(normalized as any)
}

export function validateEventImageClientFile(input: {
    name?: string | null
    type?: string | null
    size?: number | null
}) {
    const fileName = input.name?.toLowerCase().trim() ?? ''
    const extension = fileName.includes('.') ? fileName.split('.').pop() ?? '' : ''

    if (input.type?.startsWith('video/')) {
        return 'No se permite subir video.'
    }

    if (!isAllowedEventImageMimeType(input.type)) {
        return 'Solo se permiten imagenes JPG, PNG o WebP.'
    }

    if (!isAllowedEventImageFormat(extension) || isBlockedEventImageFormat(extension)) {
        return 'La extension del archivo no esta permitida.'
    }

    if (!input.size || input.size <= 0) {
        return 'El archivo esta vacio.'
    }

    if (input.size > EVENT_IMAGE_MAX_BYTES) {
        return 'La imagen no puede pesar mas de 4 MB.'
    }

    return null
}

export async function canUpdateEventImage(params: {
    supabase: any
    event: EventImagePermissionEvent
    profile: EventImagePermissionProfile
    userId: string
}) {
    if (canManageAnyEvent(params.profile.role)) {
        return true
    }

    if (params.event.status !== 'draft') {
        return false
    }

    if (params.event.created_by === params.userId) {
        return true
    }

    const { data, error } = await (params.supabase
        .from('event_speakers') as any)
        .select('speaker_id')
        .eq('event_id', params.event.id)
        .eq('speaker_id', params.profile.id)
        .limit(1)

    if (error) {
        console.error('[EventImageUpload] Failed to check speaker assignment:', error)
        return false
    }

    return Boolean(data?.[0]?.speaker_id)
}

export type CloudinaryEventImageResult = {
    secure_url?: unknown
    public_id?: unknown
    resource_type?: unknown
    format?: unknown
    bytes?: unknown
    width?: unknown
    height?: unknown
    mimeType?: unknown
}

export function validateCloudinaryEventImageResult(params: {
    result: CloudinaryEventImageResult
    eventId: string
    cloudName: string
}) {
    const secureUrl = typeof params.result.secure_url === 'string'
        ? params.result.secure_url.trim()
        : ''
    const publicId = typeof params.result.public_id === 'string'
        ? params.result.public_id.trim()
        : ''
    const resourceType = typeof params.result.resource_type === 'string'
        ? params.result.resource_type.trim()
        : ''
    const format = typeof params.result.format === 'string'
        ? params.result.format.toLowerCase().trim()
        : ''
    const mimeType = typeof params.result.mimeType === 'string'
        ? params.result.mimeType.trim()
        : null
    const bytes = Number(params.result.bytes)
    const secureUrlPrefix = getEventImageSecureUrlPrefix(params.cloudName)
    const publicIdPrefix = getEventImagePublicIdPrefix(params.eventId)

    if (resourceType !== 'image') {
        return { error: 'Cloudinary devolvio un recurso no permitido.' }
    }

    if (!secureUrl.startsWith(secureUrlPrefix)) {
        return { error: 'La URL de Cloudinary no pertenece al cloud configurado.' }
    }

    if (!publicId.startsWith(publicIdPrefix)) {
        return { error: 'La imagen no pertenece a la carpeta esperada del evento.' }
    }

    if (!new RegExp(`^${escapeRegExp(publicIdPrefix)}main-\\d+$`).test(publicId)) {
        return { error: 'El public_id de la imagen no tiene el formato esperado.' }
    }

    if (!isAllowedEventImageFormat(format) || isBlockedEventImageFormat(format)) {
        return { error: 'El formato de imagen no esta permitido.' }
    }

    if (mimeType && !isAllowedEventImageMimeType(mimeType)) {
        return { error: 'El MIME type de imagen no esta permitido.' }
    }

    if (!Number.isFinite(bytes) || bytes <= 0) {
        return { error: 'Cloudinary no devolvio un tamano valido.' }
    }

    if (bytes > EVENT_IMAGE_MAX_BYTES) {
        return { error: 'La imagen no puede pesar mas de 4 MB.' }
    }

    return {
        data: {
            secureUrl,
            publicId,
            resourceType,
            format,
            bytes,
            width: Number.isFinite(Number(params.result.width)) ? Number(params.result.width) : null,
            height: Number.isFinite(Number(params.result.height)) ? Number(params.result.height) : null,
        },
    }
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
