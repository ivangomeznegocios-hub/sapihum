'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Plus, Trash2, GripVertical, Check } from 'lucide-react'
import { createFormation, updateFormation } from '@/app/(dashboard)/dashboard/events/formation-actions'

interface FormationFormProps {
    initialData?: any
    availableEvents: any[]
}

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Borrador (oculto)' },
    { value: 'active', label: 'Activo (público)' },
    { value: 'archived', label: 'Archivado' }
]

const CERTIFICATE_OPTIONS = [
    { value: 'none', label: 'Sin certificado' },
    { value: 'participation', label: 'Constancia de participación' },
    { value: 'completion', label: 'Diploma de finalización' },
    { value: 'specialized', label: 'Acreditación especializada' }
]

export function FormationForm({ initialData, availableEvents }: FormationFormProps) {
    const router = useRouter()
    const isEdit = !!initialData
    
    // Form state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [title, setTitle] = useState(initialData?.title || '')
    const [slug, setSlug] = useState(initialData?.slug || '')
    const [subtitle, setSubtitle] = useState(initialData?.subtitle || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [imageUrl, setImageUrl] = useState(initialData?.image_url || '')
    const [status, setStatus] = useState(initialData?.status || 'draft')
    const [bundlePrice, setBundlePrice] = useState(initialData?.bundle_price?.toString() || '0')
    const [bundleMemberPrice, setBundleMemberPrice] = useState(initialData?.bundle_member_price?.toString() || '0')
    const [individualCert, setIndividualCert] = useState(initialData?.individual_certificate_type || 'participation')
    const [fullCert, setFullCert] = useState(initialData?.full_certificate_type || 'specialized')
    const [fullCertLabel, setFullCertLabel] = useState(initialData?.full_certificate_label || 'Certificación de Formación Completa')
    
    // Courses state
    const [selectedCourses, setSelectedCourses] = useState<{id: string, eventId: string}[]>(
        (initialData?.courses || []).map((c: any) => ({
            id: c.id || Math.random().toString(),
            eventId: c.event_id
        }))
    )

    // Calculate sum of individual prices
    const sumIndividualPrices = selectedCourses.reduce((sum, item) => {
        const event = availableEvents.find(e => e.id === item.eventId)
        return sum + (Number(event?.price) || 0)
    }, 0)
    
    // Auto-generate slug from title
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setTitle(newTitle)
        if (!isEdit) {
            const newSlug = newTitle
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
            setSlug(newSlug)
        }
    }

    const handleAddCourse = () => {
        // Find an event not already selected
        const unselectedEvent = availableEvents.find(e => !selectedCourses.some(sc => sc.eventId === e.id))
        if (!unselectedEvent && availableEvents.length > 0) {
            // If all selected, just add the first one as default
            setSelectedCourses([...selectedCourses, { id: Math.random().toString(), eventId: availableEvents[0].id }])
        } else if (unselectedEvent) {
            setSelectedCourses([...selectedCourses, { id: Math.random().toString(), eventId: unselectedEvent.id }])
        }
    }

    const handleRemoveCourse = (id: string) => {
        setSelectedCourses(selectedCourses.filter(c => c.id !== id))
    }

    const handleChangeCourse = (id: string, newEventId: string) => {
        setSelectedCourses(selectedCourses.map(c => 
            c.id === id ? { ...c, eventId: newEventId } : c
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        if (!title || !slug) {
            setError('El título y URL (slug) son obligatorios')
            setIsLoading(false)
            return
        }

        if (selectedCourses.length === 0) {
            setError('Debes agregar al menos un curso a esta formación')
            setIsLoading(false)
            return
        }

        const formData = {
            title,
            slug,
            subtitle: subtitle || null,
            description: description || null,
            image_url: imageUrl || null,
            status,
            bundle_price: Number(bundlePrice) || 0,
            bundle_member_price: Number(bundleMemberPrice) || 0,
            individual_certificate_type: individualCert,
            full_certificate_type: fullCert,
            full_certificate_label: fullCertLabel || null
        }

        const courseIds = selectedCourses.map(c => c.eventId).filter(Boolean)

        try {
            if (isEdit) {
                await updateFormation(initialData.id, formData, courseIds)
                router.push(`/dashboard/events/formations`)
            } else {
                await createFormation(formData as any, courseIds)
                router.push('/dashboard/events/formations')
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error al guardar la formación')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Datos Básicos */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Información General</CardTitle>
                        <CardDescription>
                            Define cómo se mostrará este paquete completo en la página pública.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">Título de la Formación</label>
                                <input
                                    value={title}
                                    onChange={handleTitleChange}
                                    required
                                    placeholder="Ej: Diplomado en Terapia Cognitivo Conductual"
                                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Slug (URL)</label>
                                <input
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    required
                                    placeholder="diplomado-en-tcc"
                                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Subtítulo</label>
                            <input
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                placeholder="Un programa estructurado para dominar casos complejos"
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Descripción</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Describe todo el programa formativo..."
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">URL de Imagen (Flyer)</label>
                                <input
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://.../imagen.jpg"
                                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Estado</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Precios */}
                <Card>
                    <CardHeader>
                        <CardTitle>Precios y Oferta</CardTitle>
                        <CardDescription>
                            Configura el precio total si compran todos los cursos en paquete.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 mb-4">
                            <p className="text-sm font-medium text-emerald-800">
                                Info de precios individuales
                            </p>
                            <p className="text-xs text-emerald-700 mt-1">
                                Si un alumno compra cada curso de esta formación por separado, el total sería de <strong>${sumIndividualPrices} MXN</strong>. Aprovecha para poner un precio menor por el paquete completo.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Precio Bundle Completo (Público General)</label>
                            <div className="flex items-center mt-1">
                                <span className="flex items-center justify-center rounded-l-md border border-r-0 bg-muted px-3 py-2 text-muted-foreground">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={bundlePrice}
                                    onChange={(e) => setBundlePrice(e.target.value)}
                                    className="w-full rounded-r-md border px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Precio Bundle Miembros SAPIHUM</label>
                            <div className="flex items-center mt-1">
                                <span className="flex items-center justify-center rounded-l-md border border-r-0 bg-muted px-3 py-2 text-muted-foreground">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={bundleMemberPrice}
                                    onChange={(e) => setBundleMemberPrice(e.target.value)}
                                    className="w-full rounded-r-md border px-3 py-2 text-sm"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Dejar en 0 si la membresía incluye este paquete 100% gratis.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Certificación */}
                <Card>
                    <CardHeader>
                        <CardTitle>Niveles de Certificación</CardTitle>
                        <CardDescription>
                            Definición de las constancias otorgadas por cursos y por programa.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Certificación por curso individual</label>
                            <select
                                value={individualCert}
                                onChange={(e) => setIndividualCert(e.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
                            >
                                {CERTIFICATE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">Lo que obtiene el alumno por terminar solo 1 de los cursos de la ruta.</p>
                        </div>

                        <div className="pt-4 border-t">
                            <label className="text-sm font-medium">Certificación Final del Programa</label>
                            <select
                                value={fullCert}
                                onChange={(e) => setFullCert(e.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
                            >
                                {CERTIFICATE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">Lo que obtiene el alumno por terminar <strong>todos</strong> los cursos del paquete.</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Etiqueta del Certificado Final</label>
                            <input
                                value={fullCertLabel}
                                onChange={(e) => setFullCertLabel(e.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="Ej: Certificación Internacional..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Bundle Courses */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>Ruta Formativa (Cursos Incluidos)</CardTitle>
                            <CardDescription>
                                Agrega los eventos existentes que completan esta formación.
                            </CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddCourse}>
                            <Plus className="h-4 w-4 mr-2" /> Agregar Curso
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {selectedCourses.length === 0 ? (
                            <div className="rounded-lg border border-dashed py-8 text-center bg-muted/20">
                                <p className="text-sm text-muted-foreground">La formación está vacía.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedCourses.map((course, index) => (
                                    <div key={course.id} className="flex items-center gap-3 p-3 bg-muted/40 border rounded-lg">
                                        <div className="w-8 flex justify-center text-muted-foreground">
                                            <span className="text-xs font-bold font-mono">{index + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                            <select
                                                value={course.eventId}
                                                onChange={(e) => handleChangeCourse(course.id, e.target.value)}
                                                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                                            >
                                                <option value="" disabled>-- Selecciona un evento/curso --</option>
                                                {availableEvents.map(event => (
                                                    <option key={event.id} value={event.id}>
                                                        {event.title} (${event.price} MXN) - {event.status}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost" 
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleRemoveCourse(course.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-4">
                            Los alumnos que compren la formación completa tendrán acceso directo a estos {selectedCourses.length} cursos. 
                            El orden de visualización en la página y certificación se basará en este listado.
                        </p>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="px-8">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        {isEdit ? 'Guardar Cambios' : 'Crear Formación'}
                    </Button>
                </div>
            </div>
        </form>
    )
}
