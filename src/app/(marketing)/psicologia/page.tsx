import type { Metadata } from 'next'
import { VerticalLanding } from '@/components/marketing/vertical-landing'
import { VERTICAL_EXPERIENCES } from '@/lib/vertical-experience'

export const metadata: Metadata = {
    title: 'SAPIHUM Psicologia | Formacion y Comunidad Profesional',
    description: 'Vertical de Psicologia en SAPIHUM: eventos, formaciones, comunidad y herramientas profesionales.',
    alternates: {
        canonical: '/psicologia',
    },
}

export default function PsicologiaPage() {
    return <VerticalLanding experience={VERTICAL_EXPERIENCES.psicologia} />
}
