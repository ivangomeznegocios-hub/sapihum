'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminCreateSpeaker } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Shield, Mic2 } from 'lucide-react'

export default function NewSpeakerPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await adminCreateSpeaker(formData)
            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: '¡Ponente creado con éxito!' })
                setTimeout(() => {
                    router.push('/dashboard/speakers')
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
                    <Link href="/dashboard/speakers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Mic2 className="h-6 w-6 text-primary" />
                        Agregar Nuevo Ponente
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Shield className="h-3 w-3 text-brand-yellow" />
                        Acción exclusiva de administradores
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Datos del Ponente</CardTitle>
                    <CardDescription>
                        Crea una cuenta para el ponente e ingresa sus datos públicos para el directorio de eventos.
                        El sistema generará una cuenta automáticamente.
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
                                    placeholder="Dr. Nombre Apellido"
                                    className="w-full px-3 py-2 border rounded-lg bg-background"
                                />
                            </div>

                            {/* Correo */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="email">
                                    Correo Electrónico *
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="correo@ejemplo.com"
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
                                    placeholder="Depresión&#10;Ansiedad&#10;Pareja"
                                    className="w-full px-3 py-2 border rounded-lg bg-background resize-y text-sm"
                                />
                            </div>
                        </div>

                        {/* Redes */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium border-b pb-2">Redes Sociales y Enlaces</h4>
                            <div className="grid gap-4 md:grid-cols-2 pt-2">
                                <div>
                                    <label className="text-xs text-muted-foreground" htmlFor="website">Sitio Web</label>
                                    <input
                                        id="website"
                                        name="website"
                                        type="url"
                                        placeholder="https://..."
                                        className="w-full px-3 py-1.5 border rounded-lg bg-background mt-1 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground" htmlFor="linkedin">LinkedIn</label>
                                    <input
                                        id="linkedin"
                                        name="linkedin"
                                        type="url"
                                        placeholder="https://linkedin.com/in/..."
                                        className="w-full px-3 py-1.5 border rounded-lg bg-background mt-1 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:justify-end">
                            <Button type="submit" disabled={isPending} className="w-full gap-2 sm:w-auto">
                                <Save className="h-4 w-4" />
                                {isPending ? 'Creando Ponente...' : 'Guardar Ponente'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
