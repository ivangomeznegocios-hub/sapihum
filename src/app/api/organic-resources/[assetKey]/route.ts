import { NextResponse } from 'next/server'
import { buildSimplePdfDocument } from '@/lib/documents/simple-pdf'
import { getOrganicContentByAssetKey } from '@/lib/organic-leads/routing'

export const runtime = 'nodejs'

interface RouteProps {
    params: Promise<{ assetKey: string }>
}

export async function GET(_request: Request, { params }: RouteProps) {
    const { assetKey } = await params
    const content = getOrganicContentByAssetKey(assetKey)
    const resource = content?.gatedResource

    if (!content || !resource) {
        return NextResponse.json({ error: 'resource_not_found' }, { status: 404 })
    }

    const lines = [
        content.title,
        '',
        content.description,
        '',
        'Resumen:',
        content.aiSummary,
        '',
        'Beneficios:',
        ...resource.benefits.map((item) => `- ${item}`),
        '',
        'Contenido base:',
        ...content.sections.flatMap((section) => [
            section.heading,
            ...section.paragraphs.map((paragraph) => `- ${paragraph}`),
        ]),
    ]

    const pdf = buildSimplePdfDocument({
        title: resource.title,
        subtitle: resource.description,
        lines,
    })

    return new NextResponse(pdf, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${assetKey}.pdf"`,
            'Cache-Control': 'private, max-age=300',
        },
    })
}
