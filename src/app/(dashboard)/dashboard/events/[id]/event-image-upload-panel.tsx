'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Image as ImageIcon, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

type EventImageUploadPanelProps = {
    eventId: string
    eventStatus: string
    initialImageUrl?: string | null
    initialAltText?: string | null
    canUpload: boolean
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

        xhr.onerror = () => reject(new Error('No fue posible subir la imagen a Cloudinary.'))
        xhr.send(formData)
    })
}

export function EventImageUploadPanel({
    eventId,
    eventStatus,
    initialImageUrl,
    initialAltText,
    canUpload,
}: EventImageUploadPanelProps) {
    const [imageUrl, setImageUrl] = useState(initialImageUrl ?? '')
    const [altText, setAltText] = useState(initialAltText ?? '')
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const displayedImageUrl = previewUrl || imageUrl
    const canSelectFile = canUpload && !isUploading
    const helperMessage = useMemo(() => {
        if (canUpload) return 'JPG, PNG o WebP. Maximo 4 MB.'
        if (eventStatus === 'draft') return 'No tienes permisos para cambiar la imagen de este borrador.'
        return 'Este evento ya no esta en borrador. Solo admin o event_manager puede cambiar la imagen.'
    }, [canUpload, eventStatus])

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] ?? null
        setError(null)
        setSuccess(null)
        setFile(null)

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }

        if (!selectedFile) return

        const validationError = validateFile(selectedFile)
        if (validationError) {
            setError(validationError)
            event.target.value = ''
            return
        }

        setFile(selectedFile)
        setPreviewUrl(URL.createObjectURL(selectedFile))
    }

    const handleUpload = async () => {
        if (!file) {
            setError('Selecciona una imagen primero.')
            return
        }

        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        setIsUploading(true)
        setProgress(0)
        setError(null)
        setSuccess(null)

        try {
            const signatureResponse = await fetch(`/api/events/${eventId}/image-upload-signature`, {
                method: 'POST',
            })
            const signaturePayload = await signatureResponse.json()

            if (!signatureResponse.ok) {
                throw new Error(signaturePayload?.error || 'No fue posible preparar la subida.')
            }

            const cloudinaryResult = await uploadToCloudinary({
                signature: signaturePayload as SignatureResponse,
                file,
                onProgress: setProgress,
            })

            const confirmResponse = await fetch(`/api/events/${eventId}/image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    secure_url: cloudinaryResult.secure_url,
                    public_id: cloudinaryResult.public_id,
                    resource_type: cloudinaryResult.resource_type,
                    format: cloudinaryResult.format,
                    bytes: cloudinaryResult.bytes,
                    width: cloudinaryResult.width,
                    height: cloudinaryResult.height,
                    mimeType: file.type,
                    alt_text: altText,
                }),
            })
            const confirmPayload = await confirmResponse.json()

            if (!confirmResponse.ok) {
                throw new Error(confirmPayload?.error || 'No fue posible guardar la imagen.')
            }

            setImageUrl(confirmPayload.imageUrl || cloudinaryResult.secure_url)
            setAltText(confirmPayload.imageAltText || altText)
            setFile(null)
            setProgress(100)
            setSuccess('Imagen actualizada correctamente. Se mostrara cuando el evento sea publicado.')

            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
                setPreviewUrl(null)
            }
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'No fue posible subir la imagen.')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ImageIcon className="h-5 w-5" />
                    Imagen del evento
                </CardTitle>
                <CardDescription>
                    Actualiza la portada que se usara cuando el evento este publicado.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                    {displayedImageUrl ? (
                        <div
                            role="img"
                            aria-label={altText || 'Imagen del evento'}
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url("${displayedImageUrl}")` }}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-sm">Sin imagen</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <a
                            href="https://chatgpt.com/g/g-69cf0d204c948191af60c9e0b07101d6-hacer-portadas-sapihum"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Generar imagen con GPT personalizado
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>

                <div className="space-y-2">
                    <label htmlFor="event-image-alt" className="text-sm font-medium">
                        Texto alternativo
                    </label>
                    <input
                        id="event-image-alt"
                        value={altText}
                        onChange={(event) => setAltText(event.target.value)}
                        maxLength={180}
                        disabled={!canUpload || isUploading}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        placeholder="Describe brevemente la imagen"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="event-image-file" className="text-sm font-medium">
                        Subir imagen
                    </label>
                    <input
                        id="event-image-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        disabled={!canSelectFile}
                        onChange={handleFileChange}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">{helperMessage}</p>
                </div>

                {isUploading && (
                    <div className="space-y-1">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{progress}% cargado</p>
                    </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}

                <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={!file || !canUpload || isUploading}
                    className="w-full"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Subiendo imagen...' : 'Actualizar imagen'}
                </Button>
            </CardContent>
        </Card>
    )
}
