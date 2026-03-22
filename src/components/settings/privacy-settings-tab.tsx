'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { exportUserData, submitARCORequest, requestAccountDeletion } from '@/actions/privacy'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

const ARCO_TYPES = [
    { value: 'access' as const, label: 'Acceso', desc: 'Quiero saber qué datos tienen de mí' },
    { value: 'rectification' as const, label: 'Rectificación', desc: 'Quiero corregir datos incorrectos' },
    { value: 'cancellation' as const, label: 'Cancelación / Olvido', desc: 'Quiero eliminar mis datos' },
    { value: 'opposition' as const, label: 'Oposición', desc: 'No quiero que procesen mis datos para ciertos fines' },
    { value: 'portability' as const, label: 'Portabilidad', desc: 'Quiero exportar mis datos en formato digital' },
]

export function PrivacySettingsTab() {
    const [selectedType, setSelectedType] = useState<typeof ARCO_TYPES[number]['value']>('access')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isDeletionRequested, setIsDeletionRequested] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Nuevos estados para modales de confirmación
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [isArcoDialogOpen, setIsArcoDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [arcoConfirmed, setArcoConfirmed] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    const handleARCOSubmit = async () => {
        setIsSubmitting(true)
        setMessage(null)
        const result = await submitARCORequest(selectedType, description)
        setIsSubmitting(false)
        if (result.success) {
            setMessage({ type: 'success', text: 'Solicitud enviada. Recibirás respuesta en un máximo de 20 días hábiles.' })
            setDescription('')
            setIsArcoDialogOpen(false)
            setArcoConfirmed(false)
        } else {
            setMessage({ type: 'error', text: result.error || 'Error al enviar solicitud' })
        }
    }

    const handleExport = async () => {
        setIsExporting(true)
        const result = await exportUserData()
        setIsExporting(false)
        if (result.success && result.data) {
            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `mis-datos-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            setIsExportDialogOpen(false)
        } else {
            setMessage({ type: 'error', text: result.error || 'Error al exportar datos' })
        }
    }

    const handleDeletion = async () => {
        setIsDeletionRequested(true)
        const result = await requestAccountDeletion()
        if (result.success) {
            setMessage({ type: 'success', text: 'Solicitud de eliminación enviada. Un administrador procesará tu solicitud en los próximos días.' })
            setIsDeleteDialogOpen(false)
            setDeleteConfirmText('')
        } else {
            setIsDeletionRequested(false)
            setMessage({ type: 'error', text: result.error || 'Error al solicitar eliminación' })
        }
    }

    return (
        <div className="space-y-6">
            {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/50 dark:border-green-900 dark:text-green-300' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/50 dark:border-red-900 dark:text-red-300'}`}>
                    {message.text}
                </div>
            )}

            {/* Data Export */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Exportar Mis Datos
                    </CardTitle>
                    <CardDescription>
                        Descarga todos tus datos personales en formato JSON (Derecho de Portabilidad — GDPR Art. 20)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => setIsExportDialogOpen(true)} disabled={isExporting} variant="outline">
                        {isExporting ? 'Exportando...' : 'Descargar mis datos (JSON)'}
                    </Button>
                </CardContent>
            </Card>

            {/* ARCO Rights Request */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Derechos ARCO / GDPR
                    </CardTitle>
                    <CardDescription>
                        Ejerce tus derechos de Acceso, Rectificación, Cancelación, Oposición o Portabilidad
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="arco-type" className="text-sm font-medium">Tipo de solicitud</Label>
                        <select
                            id="arco-type"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            {ARCO_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="arco-desc" className="text-sm font-medium">Descripción</Label>
                        <textarea
                            id="arco-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe lo que necesitas..."
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                        />
                    </div>
                    <Button onClick={() => {
                        if (!description.trim()) {
                            setMessage({ type: 'error', text: 'Por favor describe tu solicitud' })
                            return
                        }
                        setIsArcoDialogOpen(true)
                    }} disabled={isSubmitting}>
                        {isSubmitting ? 'Procediendo...' : 'Continuar Solicitud'}
                    </Button>
                </CardContent>
            </Card>

            {/* Delete Account — Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-base text-destructive flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        Eliminar Mi Cuenta
                    </CardTitle>
                    <CardDescription>
                        Solicita la eliminación permanente de tu cuenta y todos tus datos personales (Derecho al Olvido — GDPR Art. 17 / LFPDPPP Cancelación).
                        Los datos clínicos se conservarán solo si existe obligación legal.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={isDeletionRequested}
                        variant="destructive"
                    >
                        {isDeletionRequested ? 'Solicitud enviada' : 'Solicitar eliminación de cuenta'}
                    </Button>
                </CardContent>
            </Card>

            {/* === MODALES DE CONFIRMACIÓN === */}
            
            {/* Modal de Exportación */}
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar exportación de datos</DialogTitle>
                        <DialogDescription className="pt-2">
                            Estás a punto de descargar un archivo que contiene toda tu información personal y/o clínica.
                            <br/><br/>
                            <strong>Asegúrate de estar en una red y un dispositivo seguros</strong> antes de continuar, ya que serás el único responsable de la seguridad de este archivo una vez descargado.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleExport} disabled={isExporting}>
                            {isExporting ? 'Descargando...' : 'Entiendo, quiero descargar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de ARCO */}
            <Dialog open={isArcoDialogOpen} onOpenChange={setIsArcoDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar solicitud ARCO / GDPR</DialogTitle>
                        <DialogDescription className="pt-2">
                            Has iniciado una solicitud formal para ejercer tus derechos sobre tus datos.
                            Esta solicitud será evaluada por nuestro equipo de privacidad y respondida en un plazo máximo de 20 días hábiles.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-start space-x-2 py-4">
                        <Checkbox 
                            id="arco-confirm" 
                            checked={arcoConfirmed}
                            onCheckedChange={(c) => setArcoConfirmed(c as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="arco-confirm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Entiendo lo que implica esta solicitud
                            </Label>
                            <p className="text-sm text-muted-foreground pt-1">
                                Confirmo que los detalles proporcionados son exactos y comprendo que el equipo puede contactarme para verificar mi identidad.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsArcoDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleARCOSubmit} disabled={!arcoConfirmed || isSubmitting}>
                            {isSubmitting ? 'Enviando...' : 'Enviar formalmente'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Eliminación de Cuenta */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                            Peligro: Eliminar Cuenta
                        </DialogTitle>
                        <DialogDescription className="space-y-4 pt-4">
                            <p>Esta acción es <strong>IRREVERSIBLE</strong>.</p>
                            <p>Toda tu información personal, preferencias, historial y acceso a la plataforma se eliminará permanentemente. Los datos clínicos requeridos por ley (NOM-024) se conservarán bloqueados según los plazos legales, pero no podrás acceder a ellos.</p>
                            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 dark:border-red-900">
                                <p className="text-sm text-red-800 dark:text-red-300">
                                    Para confirmar tu solicitud, por favor escribe <strong>ELIMINAR MI CUENTA</strong> en mayúsculas a continuación:
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Input 
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="ELIMINAR MI CUENTA"
                            className="text-center font-bold"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeletion} 
                            disabled={deleteConfirmText !== 'ELIMINAR MI CUENTA' || isDeletionRequested}
                        >
                            {isDeletionRequested ? 'Enviando...' : 'Eliminar permanentemente'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
