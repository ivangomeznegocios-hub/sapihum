'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { adminDeactivateCommissionRule, adminUpsertCommissionRule } from './actions'

interface CommissionRule {
    id: string
    scope: 'global' | 'event' | 'speaker_event'
    sale_origin: 'speaker_direct' | 'sapihum_channel' | 'manual_adjustment'
    speaker_percentage: number
    sapihum_percentage: number
    is_active: boolean
    event?: { title?: string | null } | null
    speaker?: { full_name?: string | null } | null
}

interface AdminCommissionRulesProps {
    rules: CommissionRule[]
}

export function AdminCommissionRules({ rules }: AdminCommissionRulesProps) {
    const router = useRouter()
    const [scope, setScope] = useState<'global' | 'event' | 'speaker_event'>('global')
    const [saleOrigin, setSaleOrigin] = useState<'speaker_direct' | 'sapihum_channel' | 'manual_adjustment'>('speaker_direct')
    const [speakerPercentage, setSpeakerPercentage] = useState('80')
    const [eventId, setEventId] = useState('')
    const [speakerId, setSpeakerId] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    const submit = async () => {
        setBusy(true)
        setMessage(null)
        try {
            const result = await adminUpsertCommissionRule({
                scope,
                saleOrigin,
                speakerPercentage: Number(speakerPercentage) / 100,
                eventId: eventId || null,
                speakerId: speakerId || null,
            })
            if (result.error) {
                setMessage(result.error)
            } else {
                setMessage('Regla guardada')
                router.refresh()
            }
        } finally {
            setBusy(false)
        }
    }

    const deactivate = async (ruleId: string) => {
        setBusy(true)
        setMessage(null)
        try {
            const result = await adminDeactivateCommissionRule(ruleId)
            if (result.error) setMessage(result.error)
            else router.refresh()
        } finally {
            setBusy(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Percent className="h-4 w-4 text-primary" />
                    Reglas de Comision
                </CardTitle>
                <CardDescription>Overrides admin para ventas futuras; las ventas cerradas conservan su snapshot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-5">
                    <div className="space-y-1">
                        <Label>Alcance</Label>
                        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={scope} onChange={(event) => setScope(event.target.value as any)}>
                            <option value="global">Global</option>
                            <option value="event">Evento</option>
                            <option value="speaker_event">Evento + ponente</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label>Origen</Label>
                        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={saleOrigin} onChange={(event) => setSaleOrigin(event.target.value as any)}>
                            <option value="speaker_direct">Link ponente</option>
                            <option value="sapihum_channel">Canal SAPIHUM</option>
                            <option value="manual_adjustment">Ajuste manual</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label>% ponente</Label>
                        <Input value={speakerPercentage} onChange={(event) => setSpeakerPercentage(event.target.value)} inputMode="decimal" />
                    </div>
                    <div className="space-y-1">
                        <Label>Event ID</Label>
                        <Input value={eventId} onChange={(event) => setEventId(event.target.value)} disabled={scope === 'global'} />
                    </div>
                    <div className="space-y-1">
                        <Label>Speaker ID</Label>
                        <Input value={speakerId} onChange={(event) => setSpeakerId(event.target.value)} disabled={scope !== 'speaker_event'} />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button size="sm" onClick={submit} disabled={busy}>Guardar regla</Button>
                    {message && <p className="text-sm text-muted-foreground">{message}</p>}
                </div>
                <div className="space-y-2">
                    {rules.filter((rule) => rule.is_active).slice(0, 12).map((rule) => (
                        <div key={rule.id} className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-medium">
                                    {rule.scope} · {rule.sale_origin} · Ponente {(Number(rule.speaker_percentage) * 100).toFixed(0)}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {rule.event?.title || 'Global'} {rule.speaker?.full_name ? `· ${rule.speaker.full_name}` : ''}
                                </p>
                            </div>
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => deactivate(rule.id)}>
                                Desactivar
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
