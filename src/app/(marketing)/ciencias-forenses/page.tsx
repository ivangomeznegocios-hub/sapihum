import type { Metadata } from 'next'
import { VerticalLanding } from '@/components/marketing/vertical-landing'
import { VERTICAL_EXPERIENCES } from '@/lib/vertical-experience'

export const metadata: Metadata = {
    title: 'SAPIHUM Ciencias Forenses | Formacion Forense y Pericial',
    description: 'Vertical de Ciencias Forenses en SAPIHUM: eventos, diplomados y comunidad para perfiles forenses.',
    alternates: {
        canonical: '/ciencias-forenses',
    },
}

export default function CienciasForensesPage() {
    return <VerticalLanding experience={VERTICAL_EXPERIENCES.ciencias_forenses} />
}
