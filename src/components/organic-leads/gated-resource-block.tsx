'use client'

import { useState } from 'react'
import { Download, FileText, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrganicLeadForm } from './organic-lead-form'
import type { OrganicGatedResource, OrganicLeadActionType, OrganicLeadIntent, OrganicSourceType } from '@/lib/organic-leads/types'

interface GatedResourceBlockProps {
    resource: OrganicGatedResource
    sourcePage: string
    sourceTopic?: string | null
    sourceType: OrganicSourceType
    intent: OrganicLeadIntent
    interestTags: string[]
    actionType: OrganicLeadActionType
    ctaLabel?: string
}

export function GatedResourceBlock({
    resource,
    sourcePage,
    sourceTopic,
    sourceType,
    intent,
    interestTags,
    actionType,
    ctaLabel = 'Desbloquear descarga',
}: GatedResourceBlockProps) {
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

    return (
        <section className="rounded-[28px] border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">Descarga completa</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">{resource.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>
                </div>
            </div>

            <div className="mb-6 grid gap-3">
                {resource.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3 rounded-2xl border bg-background/60 p-3 text-sm">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                        <span>{benefit}</span>
                    </div>
                ))}
            </div>

            {downloadUrl ? (
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        Descargar recurso
                    </Button>
                </a>
            ) : (
                <OrganicLeadForm
                    sourcePage={sourcePage}
                    sourceTopic={sourceTopic}
                    sourceAsset={resource.assetKey}
                    sourceType={sourceType}
                    intent={intent}
                    interestTags={interestTags}
                    actionType={actionType}
                    ctaLabel={ctaLabel}
                    onSuccess={(result) => {
                        setDownloadUrl(result.downloadUrl ?? resource.downloadUrl)
                    }}
                />
            )}
        </section>
    )
}
