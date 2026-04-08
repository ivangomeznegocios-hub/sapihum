'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createAgreement, toggleAgreementActive, deleteAgreement } from './actions'

const AGREEMENT_CATEGORIES = [
    { value: 'salud', label: 'Salud' },
    { value: 'educacion', label: 'Educación' },
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'bienestar', label: 'Bienestar' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'otro', label: 'Otro' },
]

export function AgreementManager({ agreements }: { agreements: any[] }) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleCreate(formData: FormData) {
        setIsLoading(true)
        setError(null)
        const result = await createAgreement(formData)
        if (result.error) {
            setError(result.error)
        } else {
            setShowForm(false)
            router.refresh()
        }
        setIsLoading(false)
    }

    async function handleToggle(id: string, isActive: boolean) {
        const result = await toggleAgreementActive(id, isActive)
        if (!result.error) router.refresh()
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este convenio?')) return
        const result = await deleteAgreement(id)
        if (!result.error) router.refresh()
    }

    return (
        <div className="space-y-6">
            <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
                {showForm ? 'Cancelar' : '+ Agregar Convenio'}
            </Button>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Nuevo Convenio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium">Empresa *</label>
                                    <input name="companyName" required className="mt-1 w-full px-3 py-2 border rounded-lg bg-background" placeholder="Nombre de la empresa" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Categoría</label>
                                    <select name="category" className="mt-1 w-full px-3 py-2 border rounded-lg bg-background">
                                        {AGREEMENT_CATEGORIES.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Logo URL</label>
                                <input name="companyLogoUrl" type="url" className="mt-1 w-full px-3 py-2 border rounded-lg bg-background" placeholder="https://..." />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Descripción *</label>
                                <textarea name="description" rows={3} required className="mt-1 w-full px-3 py-2 border rounded-lg bg-background resize-none" placeholder="Describe el convenio..." />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Beneficios (uno por línea)</label>
                                <textarea name="benefits" rows={4} className="mt-1 w-full px-3 py-2 border rounded-lg bg-background resize-none" placeholder="15% descuento en consultas&#10;Acceso gratuito a webinars&#10;Material exclusivo" />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium">Código de Descuento</label>
                                    <input name="discountCode" className="mt-1 w-full px-3 py-2 border rounded-lg bg-background" placeholder="PSICOLOGIA15" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">% Descuento</label>
                                    <input name="discountPercentage" type="number" min={0} max={100} className="mt-1 w-full px-3 py-2 border rounded-lg bg-background" placeholder="15" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium">Sitio Web</label>
                                    <input name="websiteUrl" type="url" className="mt-1 w-full px-3 py-2 border rounded-lg bg-background" placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Email de Contacto</label>
                                    <input name="contactEmail" type="email" className="mt-1 w-full px-3 py-2 border rounded-lg bg-background" placeholder="contacto@empresa.com" />
                                </div>
                            </div>
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <Button type="submit" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Convenio'}</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Agreements List */}
            <div className="space-y-3">
                {agreements.map((ag: any) => (
                    <Card key={ag.id}>
                        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                                {ag.company_logo_url && (
                                    <Image
                                        src={ag.company_logo_url}
                                        alt={ag.company_name ? `Logo de ${ag.company_name}` : 'Logo del convenio'}
                                        width={64}
                                        height={40}
                                        unoptimized
                                        className="h-10 w-16 object-contain rounded"
                                    />
                                )}
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold">{ag.company_name}</span>
                                        <Badge className={ag.is_active ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-gray-100 text-gray-600 text-[10px]'}>
                                            {ag.is_active ? 'ACTIVO' : 'INACTIVO'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground capitalize">{ag.category}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{ag.description}</p>
                                </div>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggle(ag.id, !ag.is_active)}
                                    className="w-full sm:w-auto"
                                >
                                    {ag.is_active ? 'Desactivar' : 'Activar'}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(ag.id)}
                                    className="w-full sm:w-auto"
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {agreements.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No hay convenios creados</p>
                )}
            </div>
        </div>
    )
}
