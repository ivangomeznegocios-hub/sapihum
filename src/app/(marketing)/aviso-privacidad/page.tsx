import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
    {
        title: 'Responsable del tratamiento',
        items: [
            'La plataforma Comunidad de Psicologia actua como responsable de los datos personales que recopila y procesa.',
            'Este aviso aplica a usuarios, psicologos, pacientes, ponentes y visitantes del sitio.',
        ],
    },
    {
        title: 'Datos que recopilamos',
        items: [
            'Datos de identificacion y contacto: nombre, correo, telefono y datos de cuenta.',
            'Datos de membresia, facturacion y actividad dentro de la plataforma.',
            'Datos clinicos sensibles que el profesional capture para prestar el servicio.',
            'Datos tecnicos y de navegacion necesarios para seguridad, soporte y estadistica.',
        ],
    },
    {
        title: 'Finalidades del tratamiento',
        items: [
            'Gestionar cuentas, autenticacion, agenda, documentacion y comunicacion con pacientes.',
            'Operar funciones clinicas, historiales, notas SOAP, recordatorios y telehealth.',
            'Enviar notificaciones operativas y, cuando exista consentimiento, comunicaciones de marketing.',
            'Cumplir obligaciones legales, fiscales, de seguridad y de auditoria.',
        ],
    },
    {
        title: 'Datos sensibles e IA',
        items: [
            'Los datos de salud y expedientes clinicos se tratan como datos personales sensibles.',
            'Las funciones de IA para transcripcion o generacion de notas solo deben usarse con consentimiento expreso.',
            'La informacion puede ser procesada por proveedores tecnologicos para prestar el servicio, siempre bajo medidas contractuales y tecnicas razonables.',
        ],
    },
    {
        title: 'Transferencias y terceros',
        items: [
            'Podemos usar proveedores de hospedaje, correo, autenticacion, analitica, pagos y mensajeria.',
            'Cuando exista transferencia internacional, se aplicaran las salvaguardas correspondientes y el consentimiento cuando la normativa lo requiera.',
            'No vendemos datos personales.',
        ],
    },
    {
        title: 'Derechos ARCO y GDPR',
        items: [
            'Puedes solicitar acceso, rectificacion, cancelacion, oposicion y portabilidad cuando proceda.',
            'Tambien puedes retirar tu consentimiento, limitar ciertos tratamientos y pedir la eliminacion de tu cuenta segun las reglas aplicables.',
            'Para ejercer derechos, usa el panel de privacidad o escribe al canal de contacto de soporte.',
        ],
    },
    {
        title: 'Conservacion y seguridad',
        items: [
            'Conservamos la informacion solo el tiempo necesario para la relacion contractual, el cumplimiento legal y la continuidad clinica.',
            'Usamos controles de acceso, registro de auditoria, cifrado en transito y medidas de segregacion de datos segun la arquitectura disponible.',
        ],
    },
]

export default function AvisoPrivacidadPage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-16">
            <div className="mb-10 space-y-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Aviso de Privacidad
                </p>
                <h1 className="text-4xl font-bold tracking-tight">
                    Tratamiento de datos personales en Comunidad de Psicologia
                </h1>
                <p className="max-w-3xl text-muted-foreground">
                    Version vigente: 2026-03-18. Este aviso resume como operamos los datos personales, incluidos datos clinicos sensibles, dentro de la plataforma.
                </p>
                <p className="max-w-3xl text-sm text-muted-foreground">
                    El texto esta orientado a LFPDPPP, HIPAA y GDPR como marco de referencia operativo, y debe revisarse con asesoria legal local antes de publicacion final.
                </p>
            </div>

            <div className="grid gap-6">
                {sections.map((section) => (
                    <Card key={section.title} className="border-border/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">{section.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                                {section.items.map((item) => (
                                    <li key={item} className="flex gap-3">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}

                <Card className="border-border/60 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Contacto y actualizaciones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                        <p>
                            Para ejercer derechos ARCO, solicitar portabilidad o resolver dudas sobre privacidad, revisa el panel de privacidad dentro de tu cuenta o contacta al equipo de soporte que administra la plataforma.
                        </p>
                        <p>
                            Este aviso puede actualizarse para reflejar cambios legales, tecnicos o funcionales. La version publicada en la plataforma es la vigente.
                        </p>
                        <p>
                            Consulta tambien los <Link href="/terminos" className="text-primary hover:underline">Términos del Servicio</Link>.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

