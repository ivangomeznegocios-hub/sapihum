import 'server-only'

import crypto from 'node:crypto'

const CLOUDINARY_UPLOAD_RESOURCE_TYPE = 'image'
const CLOUDINARY_ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'] as const

type SignableValue = string | number | boolean | Array<string | number | boolean>

type CloudinaryConfig = {
    cloudName: string
    apiKey: string
    apiSecret: string
}

function parseCloudinaryUrl(value?: string): CloudinaryConfig | null {
    if (!value) return null

    try {
        const url = new URL(value)
        if (url.protocol !== 'cloudinary:') return null

        const cloudName = url.hostname
        const apiKey = decodeURIComponent(url.username)
        const apiSecret = decodeURIComponent(url.password)

        if (!cloudName || !apiKey || !apiSecret) return null

        return { cloudName, apiKey, apiSecret }
    } catch {
        return null
    }
}

function getCloudinaryConfig(): CloudinaryConfig {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
        const cloudinaryUrlConfig = parseCloudinaryUrl(process.env.CLOUDINARY_URL)
        if (cloudinaryUrlConfig) return cloudinaryUrlConfig

        throw new Error('Cloudinary server credentials are not configured')
    }

    return { cloudName, apiKey, apiSecret }
}

function serializeSignatureParams(params: Record<string, SignableValue | null | undefined>) {
    return Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
            const serializedValue = Array.isArray(value) ? value.join(',') : String(value)
            return `${key}=${serializedValue}`
        })
        .join('&')
}

export function signCloudinaryParams(params: Record<string, SignableValue | null | undefined>) {
    const { apiSecret } = getCloudinaryConfig()
    const payload = `${serializeSignatureParams(params)}${apiSecret}`
    return crypto.createHash('sha1').update(payload).digest('hex')
}

export function createEventImageSignature(params: {
    eventId: string
    timestampMs?: number
}) {
    const { cloudName, apiKey } = getCloudinaryConfig()
    const uploadId = params.timestampMs ?? Date.now()
    const timestamp = Math.floor(Date.now() / 1000)
    const folder = `sapihum/events/${params.eventId}/images`
    const publicId = `main-${uploadId}`
    const allowedFormats = CLOUDINARY_ALLOWED_FORMATS.join(',')
    const signature = signCloudinaryParams({
        allowed_formats: allowedFormats,
        folder,
        public_id: publicId,
        timestamp,
    })

    return {
        cloudName,
        apiKey,
        timestamp,
        signature,
        folder,
        publicId,
        resourceType: CLOUDINARY_UPLOAD_RESOURCE_TYPE,
        allowedFormats: [...CLOUDINARY_ALLOWED_FORMATS],
        allowedFormatsParam: allowedFormats,
    }
}

export async function destroyCloudinaryImage(publicId: string) {
    const { cloudName, apiKey } = getCloudinaryConfig()
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = signCloudinaryParams({
        public_id: publicId,
        timestamp,
    })
    const formData = new FormData()
    formData.set('public_id', publicId)
    formData.set('timestamp', String(timestamp))
    formData.set('api_key', apiKey)
    formData.set('signature', signature)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        body: formData,
    })

    if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`Cloudinary destroy failed (${response.status}): ${text}`)
    }

    return response.json().catch(() => null)
}

export function getCloudinaryCloudName() {
    return getCloudinaryConfig().cloudName
}
