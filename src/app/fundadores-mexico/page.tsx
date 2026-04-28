import type { Metadata } from 'next'
import { FundadoresMexicoLanding } from './fundadores-mexico-landing'

export const metadata: Metadata = {
    title: 'Miembros Fundadores SAPIHUM Mexico',
    description:
        'Entra como uno de los primeros 100 Miembros Fundadores SAPIHUM Mexico por $250 MXN al mes durante mayo de 2026.',
}

export default function FundadoresMexicoPage() {
    return <FundadoresMexicoLanding />
}
