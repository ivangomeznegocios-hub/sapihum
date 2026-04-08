'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { saveDocument } from './actions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Link as LinkIcon } from 'lucide-react'

const DocumentSchema = z.object({
    patient_id: z.string().min(1, 'Debe seleccionar un paciente'),
    file_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    file_path: z.string().url('Debe ser una URL válida (incluye http:// o https://)'),
    category: z.enum(['test_result', 'referral', 'consent', 'report', 'intake_form', 'other'] as const),
    notes: z.string().optional(),
})

type DocumentFormValues = z.infer<typeof DocumentSchema>

interface DocumentLinkFormProps {
    patients: { id: string, name: string }[]
}

export function DocumentLinkForm({ patients }: DocumentLinkFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)

    const form = useForm<DocumentFormValues>({
        resolver: zodResolver(DocumentSchema),
        defaultValues: {
            patient_id: '',
            file_name: '',
            file_path: '',
            category: 'other',
            notes: '',
        },
    })

    async function onSubmit(data: DocumentFormValues) {
        setIsPending(true)
        setServerError(null)

        try {
            const formData = new FormData()
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined) formData.append(key, value)
            })

            const result = await saveDocument({ success: false }, formData)

            if (result.success) {
                form.reset()
                setOpen(false)
                router.refresh()
            } else {
                setServerError(result.message || 'Error al guardar el enlace')
            }
        } catch {
            setServerError('Error inesperado al guardar el enlace')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Añadir Enlace
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Añadir Enlace a Documento</DialogTitle>
                    <DialogDescription>
                        Pega el enlace de Google Drive, Dropbox u otro servicio. El paciente podrá acceder haciendo clic en él.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {serverError && (
                            <div className="p-3 text-sm text-white bg-destructive rounded-md">
                                {serverError}
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="patient_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Paciente</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un paciente" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {patients.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona la categoría" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="intake_form">Formulario Inicial</SelectItem>
                                            <SelectItem value="consent">Consentimiento Informado</SelectItem>
                                            <SelectItem value="test_result">Resultado de Prueba</SelectItem>
                                            <SelectItem value="report">Reporte/Informe</SelectItem>
                                            <SelectItem value="referral">Derivación/Interconsulta</SelectItem>
                                            <SelectItem value="other">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="file_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Documento</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Historial Médico Juan Perez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="file_path"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Enlace (URL)</FormLabel>
                                    <FormControl>
                                        <Input type="url" placeholder="https://drive.google.com/..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalles adicionales sobre el documento"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Enlace'
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
