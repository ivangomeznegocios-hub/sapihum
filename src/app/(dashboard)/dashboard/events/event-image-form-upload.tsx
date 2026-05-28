'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Image as ImageIcon, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const BLOCKED_EXTENSIONS = ['svg', 'mp4', 'mov', 'avi', 'webm', 'mkv']

type SignatureResponse = {
    cloudName: string
    apiKey: string
    timestamp: number
    signature: string
    folder: string
    publicId: string
    resourceType: 'image'
    allowedFormatsParam: string
}

type EventImageFormUploadProps = {
    eventId: string
    signatureEndpoint: string
    initialImageUrl?: string | null
    initialPublicId?: string | null
    initialAltText?: string | null
}

function validateFile(file: File) {
    const extension = file.name.toLowerCase().split('.').pop() ?? ''

    if (file.type.startsWith('video/')) return 'No se permite subir video.'
    if (!ALLOWED_MIME_TYPES.includes(file.type)) return 'Solo se permiten imagenes JPG, PNG o WebP.'
    if (!ALLOWED_EXTENSIONS.includes(extension) || BLOCKED_EXTENSIONS.includes(extension)) {
        return 'La extension del archivo no esta permitida.'
    }
    if (file.size <= 0) return 'El archivo esta vacio.'
    if (file.size > MAX_BYTES) return 'La imagen no puede pesar mas de 4 MB.'

    return null
}

function uploadToCloudinary(params: {
    signature: SignatureResponse
    file: File
    onProgress: (progress: number) => void
}) {
    const formData = new FormData()
    formData.set('file', params.file)
    formData.set('api_key', params.signature.apiKey)
    formData.set('timestamp', String(params.signature.timestamp))
    formData.set('signature', params.signature.signature)
    formData.set('folder', params.signature.folder)
    formData.set('public_id', params.signature.publicId)
    formData.set('allowed_formats', params.signature.allowedFormatsParam)

    return new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open(
            'POST',
            `https://api.cloudinary.com/v1_1/${params.signature.cloudName}/${params.signature.resourceType}/upload`
        )

        xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return
            params.onProgress(Math.round((event.loaded / event.total) * 100))
        }

        xhr.onload = () => {
            let payload: any = null
            try {
                payload = JSON.parse(xhr.responseText)
            } catch {
                payload = null
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(payload)
                return
            }

            reject(new Error(payload?.error?.message || 'Cloudinary rechazo la imagen.'))
        }

        xhr.onerror = () => reject(new Error('No fue posible conectar con Cloudinary.'))
        xhr.send(formData)
    })
}

export function EventImageFormUpload({
    eventId,
    signatureEndpoint,
    initialImageUrl,
    initialPublicId,
    initialAltText,
}: EventImageFormUploadProps) {
    const [imageUrl, setImageUrl] = useState(initialImageUrl ?? '')
    const [publicId, setPublicId] = useState(initialPublicId ?? '')
    const [altText, setAltText] = useState(initialAltText ?? '')
    const [resourceType, setResourceType] = useState('')
    const [format, setFormat] = useState('')
    const [bytes, setBytes] = useState('')
    const [mimeType, setMimeType] = useState('')
    const [previewUrl, setPreviewUrl] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        setError(null)
        setMessage(null)

        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            event.target.value = ''
            return
        }

        const localPreview = URL.createObjectURL(file)
        setPreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current)
            return localPreview
        })

        try {
            setIsUploading(true)
            setProgress(0)

            const signatureResponse = await fetch(signatureEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId }),
            })
            const signaturePayload = await signatureResponse.json().catch(() => null)

            if (!signatureResponse.ok) {
                throw new Error(signaturePayload?.error || 'No fue posible preparar la subida.')
            }

            const cloudinaryResult = await uploadToCloudinary({
                signature: signaturePayload as SignatureResponse,
                file,
                onProgress: setProgress,
            })

            setImageUrl(cloudinaryResult.secure_url || '')
            setPublicId(cloudinaryResult.public_id || '')
            setResourceType(cloudinaryResult.resource_type || '')
            setFormat(cloudinaryResult.format || '')
            setBytes(String(cloudinaryResult.bytes || file.size))
            setMimeType(file.type)
            setMessage('Imagen cargada. Se guardara al crear o actualizar el evento.')
        } catch (uploadError: any) {
            setError(uploadError?.message || 'No fue posible subir la imagen.')
        } finally {
            setIsUploading(false)
        }
    }

    function handleManualUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
        setImageUrl(event.target.value)
        setPublicId('')
        setResourceType('')
        setFormat('')
        setBytes('')
        setMimeType('')
        setMessage(null)
    }

    const displayedImageUrl = previewUrl || imageUrl

    return (
        <div className="space-y-3">
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="imagePublicId" value={publicId} />
            <input type="hidden" name="imageAltText" value={altText} />
            <input type="hidden" name="imageResourceType" value={resourceType} />
            <input type="hidden" name="imageFormat" value={format} />
            <input type="hidden" name="imageBytes" value={bytes} />
            <input type="hidden" name="imageMimeType" value={mimeType} />

            <div className="overflow-hidden rounded-lg border bg-muted/30">
                {displayedImageUrl ? (
                    <div
                        className="h-44 bg-cover bg-center"
                        style={{ backgroundImage: `url(${displayedImageUrl})` }}
                        role="img"
                        aria-label={altText || 'Imagen del evento'}
                    />
                ) : (
                    <div className="flex h-44 items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                    </div>
                )}
            </div>

            <div>
                <label className="text-sm font-medium" htmlFor="imageUrl">
                    URL de imagen
                </label>
                <input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={handleManualUrlChange}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                    placeholder="https://res.cloudinary.com/..."
                />
            </div>

            <div>
                <label className="text-sm font-medium" htmlFor="imageAltTextVisible">
                    Texto alternativo
                </label>
                <input
                    id="imageAltTextVisible"
                    type="text"
                    value={altText}
                    onChange={(event) => setAltText(event.target.value)}
                    maxLength={180}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                    placeholder="Describe brevemente la imagen"
                />
            </div>

            <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                    <a
                        href="https://chatgpt.com/g/g-69cf0d204c948191af60c9e0b07101d6-hacer-portadas-sapihum"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Generar imagen con GPT personalizado
                    </a>
                </Button>

                <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? `Subiendo ${progress}%` : 'Subir JPG, PNG o WebP'}
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        className="sr-only"
                        disabled={isUploading}
                        onChange={handleFileChange}
                    />
                </label>
            </div>

            {isUploading && (
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.max(5, progress)}%` }}
                    />
                </div>
            )}

            {message && <p className="text-xs text-green-600">{message}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <p className="text-xs text-muted-foreground">
                Maximo 4 MB. Solo imagenes JPG, PNG o WebP; no se permite video ni SVG.
            </p>
        </div>
    )
}
