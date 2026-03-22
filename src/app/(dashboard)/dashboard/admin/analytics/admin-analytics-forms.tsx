'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { AttributionSnapshot } from '@/lib/analytics/types'
import { createManualDeal, createMarketingCostEntry } from './actions'

export function AdminAnalyticsForms() {
    const [isPending, startTransition] = useTransition()
    const [costMessage, setCostMessage] = useState<string | null>(null)
    const [dealMessage, setDealMessage] = useState<string | null>(null)

    const [periodStart, setPeriodStart] = useState('')
    const [periodEnd, setPeriodEnd] = useState('')
    const [costChannel, setCostChannel] = useState('')
    const [costCampaign, setCostCampaign] = useState('')
    const [costType, setCostType] = useState('ads')
    const [costOwner, setCostOwner] = useState('')
    const [costAmount, setCostAmount] = useState('')
    const [costNotes, setCostNotes] = useState('')

    const [leadName, setLeadName] = useState('')
    const [clientName, setClientName] = useState('')
    const [email, setEmail] = useState('')
    const [productName, setProductName] = useState('')
    const [productType, setProductType] = useState('manual_service')
    const [dealAmount, setDealAmount] = useState('')
    const [closedAt, setClosedAt] = useState('')
    const [dealChannel, setDealChannel] = useState('')
    const [dealCampaign, setDealCampaign] = useState('')
    const [dealOwner, setDealOwner] = useState('')
    const [dealNotes, setDealNotes] = useState('')

    function submitCost() {
        startTransition(async () => {
            const result = await createMarketingCostEntry({
                periodStart,
                periodEnd,
                channel: costChannel,
                campaign: costCampaign || null,
                costType,
                owner: costOwner || null,
                amount: Number(costAmount || 0),
                notes: costNotes || null,
            })
            if (!result.success) {
                setCostMessage(result.error || 'No se pudo guardar')
                return
            }
            setCostMessage('Costo guardado')
            setPeriodStart('')
            setPeriodEnd('')
            setCostChannel('')
            setCostCampaign('')
            setCostOwner('')
            setCostAmount('')
            setCostNotes('')
        })
    }

    function submitDeal() {
        startTransition(async () => {
            const attributionSnapshot: AttributionSnapshot = {
                firstTouch: {
                    occurredAt: closedAt || new Date().toISOString(),
                    source: dealChannel || null,
                    medium: null,
                    campaign: dealCampaign || null,
                    channel: 'unknown',
                    isDirect: false,
                },
                lastTouch: {
                    occurredAt: closedAt || new Date().toISOString(),
                    source: dealChannel || null,
                    medium: null,
                    campaign: dealCampaign || null,
                    channel: 'unknown',
                    isDirect: false,
                },
                lastNonDirectTouch: {
                    occurredAt: closedAt || new Date().toISOString(),
                    source: dealChannel || null,
                    medium: null,
                    campaign: dealCampaign || null,
                    channel: 'unknown',
                    isDirect: false,
                },
                resolvedAt: new Date().toISOString(),
            }

            const result = await createManualDeal({
                leadName: leadName || null,
                clientName: clientName || null,
                email: email || null,
                productName,
                productType,
                amount: Number(dealAmount || 0),
                closedAt,
                channel: dealChannel,
                campaign: dealCampaign || null,
                owner: dealOwner || null,
                notes: dealNotes || null,
                attributionSnapshot,
            })
            if (!result.success) {
                setDealMessage(result.error || 'No se pudo guardar')
                return
            }
            setDealMessage('Deal guardado')
            setLeadName('')
            setClientName('')
            setEmail('')
            setProductName('')
            setDealAmount('')
            setClosedAt('')
            setDealChannel('')
            setDealCampaign('')
            setDealOwner('')
            setDealNotes('')
        })
    }

    return (
        <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5 space-y-4">
                <div>
                    <h3 className="text-lg font-semibold">Costo de marketing/comercial</h3>
                    <p className="text-sm text-muted-foreground">Se usa para CAC blended, ROAS y payback.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
                    <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
                    <Input placeholder="Canal" value={costChannel} onChange={(event) => setCostChannel(event.target.value)} />
                    <Input placeholder="Campaña" value={costCampaign} onChange={(event) => setCostCampaign(event.target.value)} />
                    <Input placeholder="Tipo de costo" value={costType} onChange={(event) => setCostType(event.target.value)} />
                    <Input placeholder="Owner" value={costOwner} onChange={(event) => setCostOwner(event.target.value)} />
                    <Input type="number" placeholder="Monto MXN" value={costAmount} onChange={(event) => setCostAmount(event.target.value)} />
                </div>
                <Textarea placeholder="Notas" value={costNotes} onChange={(event) => setCostNotes(event.target.value)} rows={3} />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground">{costMessage}</span>
                    <Button onClick={submitCost} disabled={isPending || !periodStart || !periodEnd || !costChannel || !costAmount} className="w-full sm:w-auto">
                        {isPending ? 'Guardando...' : 'Guardar costo'}
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
                <div>
                    <h3 className="text-lg font-semibold">Deal manual</h3>
                    <p className="text-sm text-muted-foreground">Incluye ventas cerradas fuera de Stripe pero dentro del negocio.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Lead" value={leadName} onChange={(event) => setLeadName(event.target.value)} />
                    <Input placeholder="Cliente" value={clientName} onChange={(event) => setClientName(event.target.value)} />
                    <Input placeholder="Correo" value={email} onChange={(event) => setEmail(event.target.value)} />
                    <Input placeholder="Producto" value={productName} onChange={(event) => setProductName(event.target.value)} />
                    <Input placeholder="Tipo de producto" value={productType} onChange={(event) => setProductType(event.target.value)} />
                    <Input type="number" placeholder="Monto MXN" value={dealAmount} onChange={(event) => setDealAmount(event.target.value)} />
                    <Input type="datetime-local" value={closedAt} onChange={(event) => setClosedAt(event.target.value)} />
                    <Input placeholder="Canal" value={dealChannel} onChange={(event) => setDealChannel(event.target.value)} />
                    <Input placeholder="Campaña" value={dealCampaign} onChange={(event) => setDealCampaign(event.target.value)} />
                    <Input placeholder="Owner" value={dealOwner} onChange={(event) => setDealOwner(event.target.value)} />
                </div>
                <Textarea placeholder="Notas" value={dealNotes} onChange={(event) => setDealNotes(event.target.value)} rows={3} />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground">{dealMessage}</span>
                    <Button onClick={submitDeal} disabled={isPending || !productName || !dealAmount || !closedAt || !dealChannel} className="w-full sm:w-auto">
                        {isPending ? 'Guardando...' : 'Guardar deal'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
