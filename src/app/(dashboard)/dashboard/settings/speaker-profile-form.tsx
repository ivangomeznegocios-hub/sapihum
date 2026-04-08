'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Mic2,
    Save,
    Globe,
    Trash2,
} from 'lucide-react'
import type { Speaker } from '@/types/database'
import { saveSpeakerProfile } from './speaker-actions'

// Social network definitions with URL builders
const SOCIAL_NETWORKS: Record<string, { label: string; prefix: string; placeholder: string; icon: string; buildUrl: (username: string) => string }> = {
    instagram: {
        label: 'Instagram',
        prefix: '@',
        placeholder: 'tu_usuario',
        icon: '📸',
        buildUrl: (u) => `https://instagram.com/${u.replace(/^@/, '')}`,
    },
    twitter: {
        label: 'Twitter / X',
        prefix: '@',
        placeholder: 'tu_usuario',
        icon: '𝕏',
        buildUrl: (u) => `https://x.com/${u.replace(/^@/, '')}`,
    },
    linkedin: {
        label: 'LinkedIn',
        prefix: '',
        placeholder: 'nombre-apellido',
        icon: '💼',
        buildUrl: (u) => `https://linkedin.com/in/${u}`,
    },
    tiktok: {
        label: 'TikTok',
        prefix: '@',
        placeholder: 'tu_usuario',
        icon: '🎵',
        buildUrl: (u) => `https://tiktok.com/@${u.replace(/^@/, '')}`,
    },
    youtube: {
        label: 'YouTube',
        prefix: '@',
        placeholder: 'tu_canal',
        icon: '▶️',
        buildUrl: (u) => `https://youtube.com/@${u.replace(/^@/, '')}`,
    },
    facebook: {
        label: 'Facebook',
        prefix: '',
        placeholder: 'tu.pagina',
        icon: '📘',
        buildUrl: (u) => `https://facebook.com/${u}`,
    },
    researchgate: {
        label: 'ResearchGate',
        prefix: '',
        placeholder: 'Nombre-Apellido',
        icon: '🔬',
        buildUrl: (u) => `https://researchgate.net/profile/${u}`,
    },
    academia: {
        label: 'Academia.edu',
        prefix: '',
        placeholder: 'universidad',
        icon: '🎓',
        buildUrl: (u) => `https://independent.academia.edu/${u}`,
    },
    threads: {
        label: 'Threads',
        prefix: '@',
        placeholder: 'tu_usuario',
        icon: '🧵',
        buildUrl: (u) => `https://threads.net/@${u.replace(/^@/, '')}`,
    },
    spotify: {
        label: 'Spotify (Podcast)',
        prefix: '',
        placeholder: 'ID del show',
        icon: '🎙️',
        buildUrl: (u) => `https://open.spotify.com/show/${u}`,
    },
    pinterest: {
        label: 'Pinterest',
        prefix: '',
        placeholder: 'tu_usuario',
        icon: '📌',
        buildUrl: (u) => `https://pinterest.com/${u}`,
    },
}

// Extract username from a full URL
function extractUsername(network: string, value: string): string {
    if (!value) return ''
    const def = SOCIAL_NETWORKS[network]
    if (!def) return value

    // If it's already just a username (no http), return as-is
    if (!value.startsWith('http')) return value.replace(/^@/, '')

    // Try to extract from URL
    try {
        const url = new URL(value)
        const pathParts = url.pathname.split('/').filter(Boolean)
        const last = pathParts[pathParts.length - 1] || ''
        return last.replace(/^@/, '')
    } catch {
        return value
    }
}

interface SpeakerProfileFormProps {
    speaker: Speaker | null
    userId: string
    showSocialLinks?: boolean // Controlled by admin flag
}

export function SpeakerProfileForm({ speaker, showSocialLinks = false }: SpeakerProfileFormProps) {
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Initialize social networks from existing data
    const existingLinks = speaker?.social_links || {}
    const initialNetworks: { key: string; username: string }[] = []
    for (const [key, value] of Object.entries(existingLinks)) {
        if (key === 'website') continue // Website is handled separately
        if (value) {
            initialNetworks.push({ key, username: extractUsername(key, value) })
        }
    }
    // If no existing networks, show nothing by default (user adds them)
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

    // Available networks that haven't been added yet
    const availableNetworks = Object.entries(SOCIAL_NETWORKS).filter(
        ([key]) => !activeNetworks.find(n => n.key === key)
    )

    const handleSubmit = async (formData: FormData) => {
        // Append social network data as JSON
        const socialLinksData: Record<string, string> = {}

        // Website (full URL)
        const website = formData.get('website') as string
        if (website) socialLinksData.website = website

        // Build full URLs from usernames
        for (const network of activeNetworks) {
            if (network.username.trim()) {
                const def = SOCIAL_NETWORKS[network.key]
                if (def) {
                    socialLinksData[network.key] = def.buildUrl(network.username.trim())
                }
            }
        }

        formData.append('socialLinksJson', JSON.stringify(socialLinksData))

        startTransition(async () => {
            const result = await saveSpeakerProfile(formData)
            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: '¡Perfil de ponente actualizado!' })
                setTimeout(() => setMessage(null), 3000)
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mic2 className="h-5 w-5 text-primary" />
                    Perfil de Ponente
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    {/* Status Message */}
                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Headline */}
                    <div>
                        <label className="text-sm font-medium" htmlFor="headline">
                            Título / Rol
                        </label>
                        <input
                            id="headline"
                            name="headline"
                            type="text"
                            defaultValue={speaker?.headline || ''}
                            placeholder="Ej: Especialista en Neuropsicología"
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        />
                    </div>

                    {/* Photo URL */}
                    <div>
                        <label className="text-sm font-medium" htmlFor="photo_url">
                            URL de Foto Profesional
                        </label>
                        <input
                            id="photo_url"
                            name="photo_url"
                            type="url"
                            defaultValue={speaker?.photo_url || ''}
                            placeholder="https://..."
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="text-sm font-medium" htmlFor="bio">
                            Biografía
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            rows={5}
                            defaultValue={speaker?.bio || ''}
                            placeholder="Cuéntanos sobre tu experiencia, trayectoria y enfoque..."
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background resize-y"
                        />
                    </div>

                    {/* Credentials */}
                    <div>
                        <label className="text-sm font-medium" htmlFor="credentials">
                            Credenciales (una por línea)
                        </label>
                        <textarea
                            id="credentials"
                            name="credentials"
                            rows={3}
                            defaultValue={speaker?.credentials?.join('\n') || ''}
                            placeholder="PhD en Psicología Clínica&#10;Máster en Terapia CBT&#10;Certificación EMDR"
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background resize-y text-sm"
                        />
                    </div>

                    {/* Formations */}
                    <div>
                        <label className="text-sm font-medium" htmlFor="formations">
                            Formaciones (una por línea)
                        </label>
                        <textarea
                            id="formations"
                            name="formations"
                            rows={3}
                            defaultValue={speaker?.formations?.join('\n') || ''}
                            placeholder="Diplomado en Evaluación Neuropsicológica&#10;Seminario de Psicoterapia Sistémica"
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background resize-y text-sm"
                        />
                    </div>

                    {/* Specialties */}
                    <div>
                        <label className="text-sm font-medium" htmlFor="specialties">
                            Especialidades (una por línea)
                        </label>
                        <textarea
                            id="specialties"
                            name="specialties"
                            rows={3}
                            defaultValue={speaker?.specialties?.join('\n') || ''}
                            placeholder="Ansiedad y Depresión&#10;Terapia de Pareja&#10;Neuropsicología Infantil"
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background resize-y text-sm"
                        />
                    </div>

                    {/* Social Links - Only shown if admin has enabled this for the speaker */}
                    {showSocialLinks && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium border-b pb-2">Redes Sociales</h4>

                            {/* Website (always full URL) */}
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground">Sitio Web</label>
                                    <input
                                        name="website"
                                        type="url"
                                        defaultValue={existingLinks.website || ''}
                                        placeholder="https://tusitio.com"
                                        className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Social Networks */}
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
                                                    className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm"
                                                />
                                            </div>
                                            {network.username && (
                                                <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
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
                                <div className="flex items-center gap-2 flex-wrap">
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
                    )}

                    {/* Public Toggle */}
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <input
                            type="checkbox"
                            id="is_public"
                            name="is_public"
                            defaultChecked={speaker?.is_public !== false}
                            className="rounded"
                        />
                        <div>
                            <label className="text-sm font-medium cursor-pointer" htmlFor="is_public">
                                Perfil público
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Tu perfil aparecerá en el directorio de ponentes
                            </p>
                        </div>
                    </div>

                    {/* Submit */}
                    <Button type="submit" disabled={isPending} className="gap-2">
                        <Save className="h-4 w-4" />
                        {isPending ? 'Guardando...' : 'Guardar Perfil de Ponente'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
