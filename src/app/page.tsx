import type { Metadata } from 'next'
import { EntryGate } from '@/components/marketing/entry-gate'

export const metadata: Metadata = {
    title: 'SAPIHUM | Elige tu área',
    description: 'Selecciona el área de SAPIHUM a la que quieres entrar.',
}

export default function EntryPage() {
    return <EntryGate />
}
