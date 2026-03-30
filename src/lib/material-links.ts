import type { MaterialLink, MaterialLinkType } from '@/types/database'

export const MATERIAL_LINK_TYPE_OPTIONS: Array<{ value: MaterialLinkType; label: string }> = [
    { value: 'presentation', label: 'Presentacion' },
    { value: 'document', label: 'Documento' },
    { value: 'folder', label: 'Carpeta' },
    { value: 'download', label: 'Descarga' },
    { value: 'other', label: 'Otro enlace' },
]

export function normalizeMaterialLinkType(value: unknown): MaterialLinkType {
    switch (value) {
        case 'presentation':
        case 'document':
        case 'folder':
        case 'download':
        case 'other':
            return value
        default:
            return 'other'
    }
}

export function isValidMaterialLinkUrl(value: string) {
    try {
        const parsed = new URL(value)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

export function sanitizeMaterialLinks(value: unknown): MaterialLink[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value.flatMap((item) => {
        if (!item || typeof item !== 'object') {
            return []
        }

        const title = typeof (item as any).title === 'string' ? (item as any).title.trim() : ''
        const url = typeof (item as any).url === 'string' ? (item as any).url.trim() : ''

        if (!title || !url || !isValidMaterialLinkUrl(url)) {
            return []
        }

        const id = typeof (item as any).id === 'string' && (item as any).id.trim()
            ? (item as any).id.trim()
            : crypto.randomUUID()

        return [{
            id,
            title,
            url,
            type: normalizeMaterialLinkType((item as any).type),
        }]
    })
}
