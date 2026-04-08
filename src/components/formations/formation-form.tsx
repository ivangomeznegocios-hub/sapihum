'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Plus, Trash2, Check } from 'lucide-react'
import { createFormation, updateFormation } from '@/app/(dashboard)/dashboard/events/formation-actions'
import { MaterialLinksEditor, type EditableMaterialLink } from '@/components/materials/material-links-editor'
import { isValidMaterialLinkUrl } from '@/lib/material-links'
import { getMembershipSpecializations } from '@/lib/specializations'

interface FormationFormProps {
    initialData?: any
    availableEvents: any[]
    canPublish?: boolean
}

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Borrador (oculto)' },
    { value: 'active', label: 'Activo (publico)' },
    { value: 'archived', label: 'Archivado' },
]

const MEMBER_ACCESS_OPTIONS = [
    { value: 'full_price', label: 'Mismo precio para miembros' },
    { value: 'discounted', label: 'Precio preferencial para miembros' },
    { value: 'free', label: 'Incluido gratis para miembros' },
]

const CERTIFICATE_OPTIONS = [
    { value: 'none', label: 'Sin certificado' },
    { value: 'participation', label: 'Constancia de participacion' },
    { value: 'completion', label: 'Diploma de finalizacion' },
    { value: 'specialized', label: 'Acreditacion especializada' },
]

const MEMBERSHIP_SPECIALIZATION_OPTIONS = getMembershipSpecializations().map((specialization) => ({
    value: specialization.code,
    label: specialization.name,
}))

export function FormationForm({ initialData, availableEvents, canPublish = true }: FormationFormProps) {
    const router = useRouter()
    const isEdit = Boolean(initialData)

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [title, setTitle] = useState(initialData?.title || '')
    const [slug, setSlug] = useState(initialData?.slug || '')
    const [subtitle, setSubtitle] = useState(initialData?.subtitle || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [imageUrl, setImageUrl] = useState(initialData?.image_url || '')
    const [status, setStatus] = useState(initialData?.status || 'draft')
    const [selectedSpecializationCode, setSelectedSpecializationCode] = useState(initialData?.specialization_code || '')
    const [bundlePrice, setBundlePrice] = useState(initialData?.bundle_price?.toString() || '0')
    const [bundleMemberPrice, setBundleMemberPrice] = useState(initialData?.bundle_member_price?.toString() || '0')
    const [bundleMemberAccessType, setBundleMemberAccessType] = useState(initialData?.bundle_member_access_type || 'full_price')
    const [totalHours, setTotalHours] = useState(initialData?.total_hours?.toString() || '0')
    const [individualCert, setIndividualCert] = useState(initialData?.individual_certificate_type || 'participation')
    const [fullCert, setFullCert] = useState(initialData?.full_certificate_type || 'specialized')
    const [fullCertLabel, setFullCertLabel] = useState(initialData?.full_certificate_label || 'Certificacion de Formacion Completa')
    const [materialLinkItems, setMaterialLinkItems] = useState<EditableMaterialLink[]>(
        (initialData?.material_links || []).map((item: any, index: number) => ({
            id: typeof item?.id === 'string' ? item.id : `material-${index}`,
            title: typeof item?.title === 'string' ? item.title : '',
            url: typeof item?.url === 'string' ? item.url : '',
            type: item?.type || 'document',
        }))
    )
    const [selectedCourses, setSelectedCourses] = useState<{ id: string; eventId: string }[]>(
        (initialData?.courses || []).map((course: any) => ({
            id: course.id || Math.random().toString(),
            eventId: course.event_id,
        }))
    )

    const sumIndividualPrices = selectedCourses.reduce((sum, item) => {
        const selectedEvent = availableEvents.find((candidate) => candidate.id === item.eventId)
        return sum + (Number(selectedEvent?.price) || 0)
    }, 0)

    const memberPricingNote =
        selectedSpecializationCode
            ? bundleMemberAccessType === 'free'
                ? 'Los miembros activos Nivel 2+ de esta especialidad entran sin costo. El resto de miembros activos tambien entra sin costo.'
                : bundleMemberAccessType === 'discounted'
                    ? 'Los miembros activos Nivel 2+ de esta especialidad entran sin costo. El resto de miembros activos paga el precio preferencial que definas aqui.'
                    : 'Los miembros activos Nivel 2+ de esta especialidad entran sin costo. El resto de miembros paga precio publico.'
            : bundleMemberAccessType === 'free'
                ? 'La membresia activa activara este diplomado sin costo.'
                : bundleMemberAccessType === 'discounted'
                    ? 'Define aqui el precio exclusivo para miembros. Debe ser menor al precio publico.'
                    : 'Los miembros pagaran el mismo precio publico; el campo preferencial se ignora.'

    const draftNote = isEdit
        ? 'Como ponente, cualquier cambio se guardara en borrador hasta que un admin lo publique.'
        : 'Como ponente, esta formacion se creara en borrador para revision antes de publicarse.'

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = event.target.value
        setTitle(newTitle)

        if (!isEdit) {
            const newSlug = newTitle
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')

            setSlug(newSlug)
        }
    }

    const handleAddCourse = () => {
        const unselectedEvent = availableEvents.find((availableEvent) =>
            !selectedCourses.some((course) => course.eventId === availableEvent.id)
        )

        if (unselectedEvent) {
            setSelectedCourses((current) => [...current, { id: Math.random().toString(), eventId: unselectedEvent.id }])
            return
        }

        if (availableEvents.length > 0) {
            setSelectedCourses((current) => [...current, { id: Math.random().toString(), eventId: availableEvents[0].id }])
        }
    }

    const handleRemoveCourse = (id: string) => {
        setSelectedCourses((current) => current.filter((course) => course.id !== id))
    }

    const handleChangeCourse = (id: string, newEventId: string) => {
        setSelectedCourses((current) =>
            current.map((course) => (course.id === id ? { ...course, eventId: newEventId } : course))
        )
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setIsLoading(true)

        if (!title || !slug) {
            setError('El titulo y la URL son obligatorios')
            setIsLoading(false)
            return
        }

        if (selectedCourses.length === 0) {
            setError('Debes agregar al menos un curso a esta formacion')
            setIsLoading(false)
            return
        }

        const publicBundlePrice = Number(bundlePrice) || 0
        const preferredMemberPrice = Number(bundleMemberPrice) || 0

        if (bundleMemberAccessType === 'discounted' && publicBundlePrice > 0 && preferredMemberPrice >= publicBundlePrice) {
            setError('El precio preferencial para miembros debe ser menor al precio publico del programa completo')
            setIsLoading(false)
            return
        }

        const invalidMaterialLink = materialLinkItems.find((item) => {
            const hasContent = item.title.trim() || item.url.trim()
            if (!hasContent) {
                return false
            }

            return !item.title.trim() || !item.url.trim() || !isValidMaterialLinkUrl(item.url.trim())
        })

        if (invalidMaterialLink) {
            setError('Cada material debe tener nombre y una URL valida que empiece con http o https.')
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
            specialization_code: selectedSpecializationCode || null,
            bundle_price: publicBundlePrice,
            bundle_member_price: bundleMemberAccessType === 'discounted' ? preferredMemberPrice : 0,
            bundle_member_access_type: bundleMemberAccessType,
            total_hours: Number(totalHours) || 0,
            material_links: materialLinkItems
                .map((item) => ({
                    id: item.id,
                    title: item.title.trim(),
                    url: item.url.trim(),
                    type: item.type,
                }))
                .filter((item) => item.title && item.url),
            individual_certificate_type: individualCert,
            full_certificate_type: fullCert,
            full_certificate_label: fullCertLabel || null,
        }

        const courseIds = selectedCourses.map((course) => course.eventId).filter(Boolean)

        try {
            if (isEdit) {
                await updateFormation(initialData.id, formData, courseIds)
                router.push('/dashboard/events/formations')
            } else {
                await createFormation(formData as any, courseIds)
                router.push('/dashboard/events/formations')
            }
        } catch (submitError: any) {
            console.error(submitError)
            setError(submitError.message || 'Error al guardar la formacion')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Informacion General</CardTitle>
                        <CardDescription>
                            Define como se mostrara este diplomado o paquete completo en la pagina publica.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">Titulo de la Formacion</label>
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
                                    onChange={(event) => setSlug(event.target.value)}
                                    required
                                    placeholder="diplomado-en-tcc"
                                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Subtitulo</label>
                            <input
                                value={subtitle}
                                onChange={(event) => setSubtitle(event.target.value)}
                                placeholder="Un programa estructurado para dominar casos complejos"
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Descripcion</label>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
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
                                    onChange={(event) => setImageUrl(event.target.value)}
                                    placeholder="https://.../imagen.jpg"
                                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                />
                            </div>
                            {canPublish ? (
                                <div>
                                    <label className="text-sm font-medium">Estado</label>
                                    <select
                                        value={status}
                                        onChange={(event) => setStatus(event.target.value)}
                                        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    >
                                        {STATUS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium">Estado</label>
                                    <div className="mt-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-medium">
                                        Borrador
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">{draftNote}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Precios y Oferta</CardTitle>
                        <CardDescription>
                            Configura el precio total del diplomado, el beneficio para miembros y las horas totales.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="mb-4 rounded-lg border border-brand-brown/20 bg-brand-brown/10 p-4">
                            <p className="text-sm font-medium text-brand-brown">Info de precios individuales</p>
                            <p className="mt-1 text-xs text-brand-brown">
                                Si un alumno compra cada curso por separado, el total seria de <strong>${sumIndividualPrices} MXN</strong>.
                                Aprovecha para poner un precio menor por el paquete completo.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Precio Programa Completo (Publico General)</label>
                            <div className="mt-1 flex items-center">
                                <span className="flex items-center justify-center rounded-l-md border border-r-0 bg-muted px-3 py-2 text-muted-foreground">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={bundlePrice}
                                    onChange={(event) => setBundlePrice(event.target.value)}
                                    className="w-full rounded-r-md border px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Beneficio de membresia</label>
                            <select
                                value={bundleMemberAccessType}
                                onChange={(event) => setBundleMemberAccessType(event.target.value)}
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                {MEMBER_ACCESS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Especialidad incluida</label>
                            <select
                                value={selectedSpecializationCode}
                                onChange={(event) => setSelectedSpecializationCode(event.target.value)}
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Sin especialidad asignada</option>
                                {MEMBERSHIP_SPECIALIZATION_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Si eliges una especialidad, los miembros activos Nivel 2 o superior de esa especialidad activan la formacion sin costo. Los demas miembros siguen el beneficio configurado arriba.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Precio Programa Completo Miembros SAPIHUM</label>
                            <div className="mt-1 flex items-center">
                                <span className="flex items-center justify-center rounded-l-md border border-r-0 bg-muted px-3 py-2 text-muted-foreground">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={bundleMemberPrice}
                                    onChange={(event) => setBundleMemberPrice(event.target.value)}
                                    disabled={bundleMemberAccessType !== 'discounted'}
                                    className="w-full rounded-r-md border px-3 py-2 text-sm"
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{memberPricingNote}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Horas Totales del Programa</label>
                            <div className="mt-1 flex items-center">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={totalHours}
                                    onChange={(event) => setTotalHours(event.target.value)}
                                    className="w-full rounded-l-md border px-3 py-2 text-sm"
                                />
                                <span className="flex items-center justify-center rounded-r-md border border-l-0 bg-muted px-3 py-2 text-xs text-muted-foreground">
                                    horas
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Ejemplo: 3 cursos de 8 horas cada uno = 24 horas totales.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Niveles de Certificacion</CardTitle>
                        <CardDescription>
                            Define la constancia por curso individual y el certificado final del diplomado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Certificacion por curso individual</label>
                            <select
                                value={individualCert}
                                onChange={(event) => setIndividualCert(event.target.value)}
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                {CERTIFICATE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Lo que obtiene el alumno por terminar solo uno de los cursos de la ruta.
                            </p>
                        </div>

                        <div className="border-t pt-4">
                            <label className="text-sm font-medium">Certificacion Final del Programa</label>
                            <select
                                value={fullCert}
                                onChange={(event) => setFullCert(event.target.value)}
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                {CERTIFICATE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Lo que obtiene el alumno por terminar todos los cursos requeridos del paquete.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Etiqueta del Certificado Final</label>
                            <input
                                value={fullCertLabel}
                                onChange={(event) => setFullCertLabel(event.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="Ej: Certificacion Internacional..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Materiales y Enlaces</CardTitle>
                        <CardDescription>
                            Agrega presentaciones, PDFs, carpetas o enlaces externos para que los alumnos puedan abrirlos despues.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MaterialLinksEditor
                            items={materialLinkItems}
                            onChange={setMaterialLinkItems}
                            helperText={
                                canPublish
                                    ? 'Estos enlaces se guardaran dentro de la formacion y quedaran listos para mostrarse cuando la publicacion este activa.'
                                    : 'Como ponente, la formacion y sus materiales se enviaran en borrador para revision administrativa.'
                            }
                            emptyText="Todavia no hay materiales por enlace para esta formacion."
                        />
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>Ruta Formativa (Eventos o Cursos Incluidos)</CardTitle>
                            <CardDescription>
                                Agrega los eventos existentes que componen este diplomado o paquete completo.
                            </CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddCourse}>
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Evento
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {selectedCourses.length === 0 ? (
                            <div className="rounded-lg border border-dashed bg-muted/20 py-8 text-center">
                                <p className="text-sm text-muted-foreground">La formacion todavia no tiene eventos vinculados.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedCourses.map((course, index) => (
                                    <div key={course.id} className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                                        <div className="flex w-8 justify-center text-muted-foreground">
                                            <span className="font-mono text-xs font-bold">{index + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                            <select
                                                value={course.eventId}
                                                onChange={(event) => handleChangeCourse(course.id, event.target.value)}
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            >
                                                <option value="" disabled>
                                                    -- Selecciona un evento o curso --
                                                </option>
                                                {availableEvents.map((availableEvent) => (
                                                    <option key={availableEvent.id} value={availableEvent.id}>
                                                        {availableEvent.title} (${availableEvent.price} MXN) - {availableEvent.status}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => handleRemoveCourse(course.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="mt-4 text-xs text-muted-foreground">
                            Los alumnos que compren la formacion completa tendran acceso directo a estos {selectedCourses.length} eventos o cursos vinculados.
                            El orden de visualizacion y el avance se basaran en este listado.
                        </p>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3 border-t pt-4 md:col-span-2">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="px-8">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        {isEdit ? 'Guardar Cambios' : canPublish ? 'Crear Formacion' : 'Crear Formacion en Borrador'}
                    </Button>
                </div>
            </div>
        </form>
    )
}
