'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitBrandBrief, initializeServicesIfNeeded } from './actions'
import {
    Loader2,
    X,
    Send,
    CheckCircle2,
    FileEdit,
    Sparkles,
} from 'lucide-react'
import type { MarketingBrief } from '@/lib/supabase/queries/marketing-services'

// ============================================
// BRAND BRIEF MODAL
// ============================================
interface BrandBriefModalProps {
    existingBrief: MarketingBrief | null
    onClose: () => void
}

export function BrandBriefModal({ existingBrief, onClose }: BrandBriefModalProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [success, setSuccess] = useState(false)

    const [form, setForm] = useState({
        brand_name: existingBrief?.brand_name ?? '',
        tone_of_voice: existingBrief?.tone_of_voice ?? '',
        target_audience: existingBrief?.target_audience ?? '',
        colors_and_style: existingBrief?.colors_and_style ?? '',
        social_links: existingBrief?.social_links ?? '',
        goals: existingBrief?.goals ?? '',
        additional_notes: existingBrief?.additional_notes ?? '',
    })

    function handleChange(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    function handleSubmit() {
        startTransition(async () => {
            const result = await submitBrandBrief(form)
            if (result.success) {
                setSuccess(true)
                setTimeout(() => {
                    onClose()
                    router.refresh()
                }, 1500)
            } else {
                alert(result.error || 'Error al enviar')
            }
        })
    }

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md text-center py-12">
                    <CardContent className="space-y-4">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                        <h2 className="text-2xl font-bold">¡Brief Enviado!</h2>
                        <p className="text-muted-foreground">
                            Tu equipo de marketing revisará tu brief y comenzará a trabajar.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl my-8">
                <CardHeader className="relative">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            <FileEdit className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-xl">
                            {existingBrief ? 'Editar Brief de Marca' : 'Brief de Marca Personal'}
                        </CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Completa este formulario para que tu equipo de marketing conozca tu marca y comience a crear contenido.
                    </p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="brand_name">Nombre de tu marca o consultorio</Label>
                        <Input
                            id="brand_name"
                            placeholder="Ej: Psic. María López — Consultorio Integral"
                            value={form.brand_name}
                            onChange={e => handleChange('brand_name', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tone_of_voice">Tono de voz</Label>
                        <Textarea
                            id="tone_of_voice"
                            placeholder="¿Cómo quieres que suene tu marca? Ej: Profesional pero cercano, empático, educativo..."
                            value={form.tone_of_voice}
                            onChange={e => handleChange('tone_of_voice', e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="target_audience">Público objetivo</Label>
                        <Textarea
                            id="target_audience"
                            placeholder="¿A quién quieres llegar? Ej: Adultos 25-45 años con ansiedad, parejas en conflicto..."
                            value={form.target_audience}
                            onChange={e => handleChange('target_audience', e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="colors_and_style">Colores y estilo visual</Label>
                        <Textarea
                            id="colors_and_style"
                            placeholder="¿Tienes colores de marca? ¿Prefieres un estilo minimalista, colorido, clínico...?"
                            value={form.colors_and_style}
                            onChange={e => handleChange('colors_and_style', e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="social_links">Links de redes sociales actuales</Label>
                        <Textarea
                            id="social_links"
                            placeholder="Instagram, Facebook, sitio web, etc."
                            value={form.social_links}
                            onChange={e => handleChange('social_links', e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="goals">Objetivos de marketing</Label>
                        <Textarea
                            id="goals"
                            placeholder="¿Qué quieres lograr? Ej: Más pacientes, posicionarme como experto en ansiedad, crecer en redes..."
                            value={form.goals}
                            onChange={e => handleChange('goals', e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="additional_notes">Notas adicionales (opcional)</Label>
                        <Textarea
                            id="additional_notes"
                            placeholder="Cualquier otro detalle que quieras compartir con tu equipo"
                            value={form.additional_notes}
                            onChange={e => handleChange('additional_notes', e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={onClose} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            {existingBrief ? 'Actualizar Brief' : 'Enviar Brief'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ============================================
// BRAND BRIEF TRIGGER BUTTON
// ============================================
interface BriefButtonProps {
    existingBrief: MarketingBrief | null
    variant?: 'default' | 'hero'
}

export function BriefButton({ existingBrief, variant = 'default' }: BriefButtonProps) {
    const [showModal, setShowModal] = useState(false)

    return (
        <>
            {variant === 'hero' ? (
                <Button
                    className="bg-white text-slate-900 hover:bg-slate-100"
                    onClick={() => setShowModal(true)}
                >
                    <FileEdit className="w-4 h-4 mr-2" />
                    {existingBrief ? 'Editar Brief de Marca' : 'Llenar Brief de Marca'}
                </Button>
            ) : (
                <Button
                    onClick={() => setShowModal(true)}
                    className="w-full justify-between"
                >
                    {existingBrief ? 'Editar Brief de Marca' : 'Llenar Brief de Marca'}
                    <FileEdit className="w-4 h-4 ml-2" />
                </Button>
            )}

            {showModal && (
                <BrandBriefModal
                    existingBrief={existingBrief}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    )
}

// ============================================
// SERVICE INITIALIZER (client trigger)
// ============================================
export function ServiceInitializer() {
    const [isPending, startTransition] = useTransition()

    // Auto-initialize on mount
    useEffect(() => {
        startTransition(async () => {
            await initializeServicesIfNeeded()
        })
    }, [])

    return null // invisible component
}
