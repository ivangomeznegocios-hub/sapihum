import { ORGANIC_CONTENT } from './content'
import type { OrganicContentAsset } from './types'

export interface QualityReport {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

const FORBIDDEN_CLAIMS = [
    'garantiza',
    'blinda legalmente',
    'cumple 100%',
    'validado clinicamente',
    'aumenta pacientes asegurado',
    'metodo probado',
    'resultados garantizados',
]

const EMPTY_BUZZWORDS = [
    'contenido de valor',
    'estrategias efectivas',
    'fortalece tu practica',
    'crece profesionalmente',
    'mejora tus resultados',
]

export function validateAssetQuality(asset: OrganicContentAsset): { errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // 1. Basic Fields Check
    if (!asset.slug) errors.push('Falta slug')
    if (!asset.title || asset.title.length < 15) errors.push('El titulo es inexistente o demasiado corto')
    if (!asset.description || asset.description.length < 30) errors.push('La descripcion es inexistente o demasiado corta')
    if (!asset.aiSummary || asset.aiSummary.length < 50) errors.push('El resumen de IA es demasiado corto para ser util (minimo 50 caracteres)')
    if (!asset.topic) errors.push('Falta topic principal')
    if (!asset.ctaLabel) errors.push('Falta ctaLabel contextual')
    if (!asset.interestTags || asset.interestTags.length === 0) errors.push('Falta definir tags de interes')

    // 2. Sections Density Check
    if (!asset.sections || asset.sections.length < 2) {
        errors.push(`El contenido tiene muy pocas secciones (${asset.sections?.length ?? 0}). Minimo 2`)
    } else {
        asset.sections.forEach((section) => {
            if (!section.heading) errors.push('Una seccion no tiene encabezado')
            if (!section.paragraphs || section.paragraphs.length === 0) {
                errors.push(`La seccion "${section.heading}" no tiene parrafos`)
            } else {
                const totalLength = section.paragraphs.reduce((sum, p) => sum + p.length, 0)
                if (totalLength < 100) {
                    warnings.push(`La seccion "${section.heading}" tiene un contenido muy corto (${totalLength} caracteres). Enriquecer.`)
                }
            }
        })
    }

    // 3. FAQs check
    if (asset.schemaTypes.includes('FAQPage') && (!asset.faqs || asset.faqs.length === 0)) {
        errors.push('Declarado FAQPage en schema pero no tiene faqs de consulta')
    }

    // 4. Claims and Buzzwords check
    const textToCheck = JSON.stringify(asset).toLowerCase()

    FORBIDDEN_CLAIMS.forEach((claim) => {
        if (textToCheck.includes(claim.toLowerCase())) {
            errors.push(`Claim clinic-legal absoluto prohibido detectado: "${claim}". Suavizar terminologia.`)
        }
    })

    EMPTY_BUZZWORDS.forEach((word) => {
        if (textToCheck.includes(word.toLowerCase())) {
            warnings.push(`Se detecto una frase vacia o buzzword: "${word}". Intenta explicar con precision el COMO o que significa exactamente.`)
        }
    })

    // 5. Disclaimer check for sensitive items
    const isSensitive = ['guide', 'resource_format', 'tool'].includes(asset.contentType)
    if (isSensitive) {
        const hasDisclaimer = asset.sections.some(s => 
            s.paragraphs.some(p => p.toLowerCase().includes('este contenido es informativo') || p.toLowerCase().includes('este contenido es de carácter') || p.toLowerCase().includes('disclaimer'))
        )
        if (!hasDisclaimer) {
            warnings.push('Guia/Recurso sensible sin disclaimer profesional visible. Considera anadir advertencia.')
        }
    }

    // 6. Gated resource checks
    if (asset.gatedResource) {
        const gated = asset.gatedResource
        if (!gated.assetKey) errors.push('Falta assetKey en gatedResource')
        if (!gated.title) errors.push('Falta titulo en gatedResource')
        if (!gated.description) errors.push('Falta descripcion en gatedResource')
        if (!gated.benefits || gated.benefits.length < 2) errors.push('Falta detallar al menos 2 beneficios en gatedResource')
    }

    return { errors, warnings }
}

export function auditEntireContent(): QualityReport {
    let isValid = true
    const errors: string[] = []
    const warnings: string[] = []

    ORGANIC_CONTENT.forEach((asset) => {
        const result = validateAssetQuality(asset)
        if (result.errors.length > 0) {
            isValid = false
            result.errors.forEach(e => errors.push(`[${asset.slug}] Error: ${e}`))
        }
        result.warnings.forEach(w => warnings.push(`[${asset.slug}] Warning: ${w}`))
    })

    return { isValid, errors, warnings }
}
