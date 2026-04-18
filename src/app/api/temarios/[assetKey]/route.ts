import { NextResponse } from 'next/server'
import { buildSimplePdfDocument } from '@/lib/documents/simple-pdf'
import {
    getCampaignPrimaryEvent,
    getEventCampaignByKey,
} from '@/lib/events/campaigns'

export const runtime = 'nodejs'

interface RouteProps {
    params: Promise<{ assetKey: string }>
}

export async function GET(_request: Request, { params }: RouteProps) {
    const { assetKey } = await params
    const campaign = getEventCampaignByKey(assetKey)

    if (!campaign) {
        return NextResponse.json({ error: 'Temario no encontrado' }, { status: 404 })
    }

    const primaryEvent = getCampaignPrimaryEvent(campaign)
    const lines = [
        `Bloque: ${campaign.title}`,
        '',
        `Objetivo: ${campaign.temario.objective}`,
        '',
        'Perfil ideal:',
        ...campaign.temario.idealFor.map((item) => `- ${item}`),
        '',
        'Temas del bloque:',
        ...campaign.temario.topics.map((topic, index) => `${index + 1}. ${topic}`),
        '',
        campaign.temario.closingLine,
        '',
        `Evento recomendado para empezar: ${primaryEvent.title}`,
        `Inscripcion: /eventos/${primaryEvent.slug}`,
    ]

    const pdf = buildSimplePdfDocument({
        title: campaign.temario.title,
        subtitle: campaign.temario.subtitle,
        lines,
    })

    return new NextResponse(pdf, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${campaign.temario.fileName}.pdf"`,
            'Cache-Control': 'public, max-age=3600',
        },
    })
}
