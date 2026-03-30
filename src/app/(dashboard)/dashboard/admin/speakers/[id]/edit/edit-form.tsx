'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminUpdateSpeaker } from '../../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Shield, Mic2, Globe, Trash2, Plus } from 'lucide-react'

// Social network definitions (same as speaker-profile-form)
const SOCIAL_NETWORKS: Record<string, { label: string; prefix: string; placeholder: string; icon: string; buildUrl: (username: string) => string }> = {
    instagram: {
        label: 'Instagram', prefix: '@', placeholder: 'tu_usuario', icon: '📸',
        buildUrl: (u) => `https://instagram.com/${u.replace(/^@/, '')}`,
    },
    twitter: {
        label: 'Twitter / X', prefix: '@', placeholder: 'tu_usuario', icon: '𝕏',
        buildUrl: (u) => `https://x.com/${u.replace(/^@/, '')}`,
    },
    linkedin: {
        label: 'LinkedIn', prefix: '', placeholder: 'nombre-apellido', icon: '💼',
        buildUrl: (u) => `https://linkedin.com/in/${u}`,
    },
    tiktok: {
        label: 'TikTok', prefix: '@', placeholder: 'tu_usuario', icon: '🎵',
        buildUrl: (u) => `https://tiktok.com/@${u.replace(/^@/, '')}`,
    },
    youtube: {
        label: 'YouTube', prefix: '@', placeholder: 'tu_canal', icon: '▶️',
        buildUrl: (u) => `https://youtube.com/@${u.replace(/^@/, '')}`,
    },
    facebook: {
        label: 'Facebook', prefix: '', placeholder: 'tu.pagina', icon: '📘',
        buildUrl: (u) => `https://facebook.com/${u}`,
    },
    researchgate: {
        label: 'ResearchGate', prefix: '', placeholder: 'Nombre-Apellido', icon: '🔬',
        buildUrl: (u) => `https://researchgate.net/profile/${u}`,
    },
    academia: {
        label: 'Academia.edu', prefix: '', placeholder: 'universidad', icon: '🎓',
        buildUrl: (u) => `https://independent.academia.edu/${u}`,
    },
    threads: {
        label: 'Threads', prefix: '@', placeholder: 'tu_usuario', icon: '🧵',
        buildUrl: (u) => `https://threads.net/@${u.replace(/^@/, '')}`,
    },
    spotify: {
        label: 'Spotify (Podcast)', prefix: '', placeholder: 'ID del show', icon: '🎙️',
        buildUrl: (u) => `https://open.spotify.com/show/${u}`,
    },
    pinterest: {
        label: 'Pinterest', prefix: '', placeholder: 'tu_usuario', icon: '📌',
        buildUrl: (u) => `https://pinterest.com/${u}`,
    },
}

function extractUsername(network: string, value: string): string {
    if (!value) return ''
    if (!value.startsWith('http')) return value.replace(/^@/, '')
    try {
        const url = new URL(value)
        const pathParts = url.pathname.split('/').filter(Boolean)
        return (pathParts[pathParts.length - 1] || '').replace(/^@/, '')
    } catch {
        return value
    }
}

interface EditSpeakerPageProps {
    speaker: any
}

export default function EditSpeakerForm({ speaker }: EditSpeakerPageProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [socialLinksEnabled, setSocialLinksEnabled] = useState(!!speaker.social_links_enabled)

    // Initialize social networks from existing data
    const existingLinks = speaker.social_links || {}
    const initialNetworks: { key: string; username: string }[] = []
    for (const [key, value] of Object.entries(existingLinks)) {
        if (key === 'website') continue
        if (value) {
            initialNetworks.push({ key, username: extractUsername(key, value as string) })
        }
    }
    const [activeNetworks, setActiveNetworks] = useState<{ key: string; username: string }[]>(
        initialNetworks.length > 0 ? initialNetworks : []
    )

    function addNetwork(networkKey: string) {
        if (activeNetworks.find(n => n.key === networkKey)) return
        setActiveNetworks(prev => [...prev, { key: networkKey, username: '' }])
    }

    function removeNetwork(networkKey: string) {
        setActiveNetworks(prev => prev.filter(n => n.key !== networkKey))
    }

    function updateNetworkUsername(networkKey: string, username: string) {
        setActiveNetworks(prev => prev.map(n => n.key === networkKey ? { ...n, username } : n))
    }

    const availableNetworks = Object.entries(SOCIAL_NETWORKS).filter(
        ([key]) => !activeNetworks.find(n => n.key === key)
    )

    const handleSubmit = async (formData: FormData) => {
        // Build social links JSON
        const socialLinksData: Record<string, string> = {}
        const website = formData.get('website') as string
        if (website) socialLinksData.website = website

        for (const network of activeNetworks) {
            if (network.username.trim()) {
                const def = SOCIAL_NETWORKS[network.key]
                if (def) {
                    socialLinksData[network.key] = def.buildUrl(network.username.trim())
                }
            }
        }

        formData.append('socialLinksJson', JSON.stringify(socialLinksData))
        formData.append('social_links_enabled', socialLinksEnabled ? 'on' : '')

        startTransition(async () => {
            const result = await adminUpdateSpeaker(speaker.id, formData)
            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: '¡Ponente actualizado con éxito!' })
                setTimeout(() => {
                    router.push(`/dashboard/speakers/${speaker.id}`)
                    router.refresh()
                }, 1500)
            }
        })
    }

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/speakers/${speaker.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Mic2 className="h-6 w-6 text-primary" />
                        Editar Ponente
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Shield className="h-3 w-3 text-brand-yellow" />
                        Acción de administrador / ponente
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Datos del Ponente</CardTitle>
                    <CardDescription>
                        Actualiza la información pública de {speaker.profile?.full_name || 'este ponente'}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                        {message && (
                            <div className={`p-4 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Nombre */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="fullName">
                                    Nombre Completo *
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    defaultValue={speaker.profile?.full_name || ''}
                                    placeholder="Dr. Nombre Apellido"
                                    className="w-full px-3 py-2 border rounded-lg bg-background"
                                />
                            </div>

                            {/* Headline */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="headline">
                                    Título / Rol
                                </label>
                                <input
                                    id="headline"
                                    name="headline"
                                    type="text"
                                    defaultValue={speaker.headline || ''}
                                    placeholder="Especialista en Psicología Clínica"
                                    className="w-full px-3 py-2 border rounded-lg bg-background"
                                />
                            </div>

                            {/* Foto URL */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="photo_url">
                                    URL de Foto
                                </label>
                                <input
                                    id="photo_url"
                                    name="photo_url"
                                    type="url"
                                    defaultValue={speaker.photo_url || ''}
                                    placeholder="https://"
                                    className="w-full px-3 py-2 border rounded-lg bg-background"
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="bio">
                                Biografía
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                rows={4}
                                defaultValue={speaker.bio || ''}
                                placeholder="Experiencia y trayectoria..."
                                className="w-full px-3 py-2 border rounded-lg bg-background resize-y"
                            />
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Credentials */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="credentials">
                                    Credenciales (una por línea)
                                </label>
                                <textarea
                                    id="credentials"
                                    name="credentials"
                                    rows={3}
                                    defaultValue={speaker.credentials?.join('\n') || ''}
                                    placeholder="Lic. en Psicología&#10;Maestría en Terapias Contextuales"
                                    className="w-full px-3 py-2 border rounded-lg bg-background resize-y text-sm"
                                />
                            </div>

                            {/* Specialties */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="specialties">
                                    Especialidades (una por línea)
                                </label>
                                <textarea
                                    id="specialties"
                                    name="specialties"
                                    rows={3}
                                    defaultValue={speaker.specialties?.join('\n') || ''}
                                    placeholder="Depresión&#10;Ansiedad&#10;Pareja"
                                    className="w-full px-3 py-2 border rounded-lg bg-background resize-y text-sm"
                                />
                            </div>

                            {/* Formations */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium" htmlFor="formations">
                                    Formaciones (una por línea)
                                </label>
                                <textarea
                                    id="formations"
                                    name="formations"
                                    rows={3}
                                    defaultValue={speaker.formations?.join('\n') || ''}
                                    placeholder="Curso en Psicoterapia Breve&#10;Diplomado en Intervención en Crisis"
                                    className="w-full px-3 py-2 border rounded-lg bg-background resize-y text-sm"
                                />
                            </div>
                        </div>

                        {/* Admin Toggle: Enable Social Links for this Speaker */}
                        <div className="border-2 border-brand-yellow dark:border-brand-yellow rounded-xl p-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="social_links_enabled"
                                    checked={socialLinksEnabled}
                                    onChange={(e) => setSocialLinksEnabled(e.target.checked)}
                                    className="rounded"
                                />
                                <div>
                                    <label className="text-sm font-medium cursor-pointer flex items-center gap-2" htmlFor="social_links_enabled">
                                        <Shield className="h-4 w-4 text-brand-yellow" />
                                        Permitir redes sociales para este ponente
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        Si está desactivado, el ponente no verá la sección de redes sociales en su perfil y las redes no se mostrarán al público.
                                    </p>
                                </div>
                            </div>

                            {/* Social Links (always visible to admin for editing) */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-sm font-medium border-b pb-2">Redes Sociales y Enlaces</h4>

                                {/* Website */}
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1">
                                        <label className="text-xs text-muted-foreground">Sitio Web</label>
                                        <input
                                            name="website"
                                            type="url"
                                            defaultValue={existingLinks.website || ''}
                                            placeholder="https://tusitio.com"
                                            className="w-full px-3 py-1.5 border rounded-lg bg-background mt-1 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Networks */}
                                {activeNetworks.map((network) => {
                                    const def = SOCIAL_NETWORKS[network.key]
                                    if (!def) return null
                                    return (
                                        <div key={network.key} className="flex items-center gap-2 group">
                                            <span className="text-lg shrink-0 w-6 text-center">{def.icon}</span>
                                            <div className="flex-1">
                                                <label className="text-xs text-muted-foreground">{def.label}</label>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {def.prefix && (
                                                        <span className="text-sm text-muted-foreground font-mono">{def.prefix}</span>
                                                    )}
                                                    <input
                                                        type="text"
                                                        value={network.username}
                                                        onChange={(e) => updateNetworkUsername(network.key, e.target.value)}
                                                        placeholder={def.placeholder}
                                                        className="flex-1 px-3 py-1.5 border rounded-lg bg-background text-sm"
                                                    />
                                                </div>
                                                {network.username && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                                                        → {def.buildUrl(network.username)}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                                                onClick={() => removeNetwork(network.key)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}

                                {/* Add Network Button */}
                                {availableNetworks.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <span className="text-xs text-muted-foreground">Agregar:</span>
                                        {availableNetworks.map(([key, def]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => addNetwork(key)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs hover:bg-muted transition-colors"
                                            >
                                                <span>{def.icon}</span>
                                                {def.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:justify-end">
                            <Button type="submit" disabled={isPending} className="w-full gap-2 sm:w-auto">
                                <Save className="h-4 w-4" />
                                {isPending ? 'Guardando cambios...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
