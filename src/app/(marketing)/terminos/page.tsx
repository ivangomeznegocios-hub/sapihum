import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
    {
        title: 'Alcance del servicio',
        items: [
            'La plataforma ofrece herramientas para gestion de consultas, agenda, documentacion, notificaciones, pagos y comunidad profesional.',
            'El uso de funciones clinicas, telehealth e IA depende del plan, el rol del usuario y los consentimientos aplicables.',
        ],
    },
    {
        title: 'Cuentas y acceso',
        items: [
            'Debes proporcionar informacion veraz, mantener la confidencialidad de tus credenciales y notificar accesos no autorizados.',
            'La plataforma puede suspender accesos ante uso indebido, fraude, riesgo legal o violaciones de seguridad.',
        ],
    },
    {
        title: 'Responsabilidad clinica',
        items: [
            'La plataforma apoya el trabajo profesional, pero no sustituye el criterio del psicologo ni las obligaciones del prestador del servicio de salud.',
            'El usuario clinico es responsable de revisar, validar y decidir el uso de notas, transcripciones y recomendaciones generadas por IA.',
        ],
    },
    {
        title: 'IA y terceros',
        items: [
            'Las funciones de IA y los servicios de terceros pueden procesar informacion para transcripcion, analitica, correo, autenticacion, pagos o mensajeria.',
            'El uso de dichas funciones exige el consentimiento que corresponda y el cumplimiento de la politica de privacidad vigente.',
        ],
    },
    {
        title: 'Pagos, membresias y reembolsos',
        items: [
            'Las membresias, comisiones y servicios premium se cobran conforme al plan contratado y a la informacion publicada en la plataforma.',
            'Los reembolsos, cargos recurrentes y cancelaciones se sujetan a las reglas del medio de pago y a las politicas comerciales activas.',
        ],
    },
    {
        title: 'Propiedad intelectual y uso aceptable',
        items: [
            'El contenido, marca, diseno y software de la plataforma estan protegidos por derechos aplicables.',
            'No debes intentar vulnerar la seguridad, extraer datos, automatizar accesos indebidos ni usar la plataforma para fines ilicitos.',
        ],
    },
    {
        title: 'Limitacion de responsabilidad',
        items: [
            'La plataforma se ofrece "tal cual" en la medida permitida por la ley y puede tener limitaciones tecnicas o interrupciones.',
            'No somos responsables por decisiones clinicas tomadas sin revision humana, ni por el uso de servicios de terceros fuera de nuestro control razonable.',
        ],
    },
]

export default function TerminosPage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-16">
            <div className="mb-10 space-y-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Términos del Servicio
                </p>
                <h1 className="text-4xl font-bold tracking-tight">
                    Reglas de uso de la plataforma
                </h1>
                <p className="max-w-3xl text-muted-foreground">
                    Version vigente: 2026-03-18. Estos terminos describen como se puede usar la plataforma y como se gestionan los servicios digitales y clinicos ofrecidos.
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
                        <CardTitle className="text-xl">Cambios y contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                        <p>
                            Podemos actualizar estos terminos cuando cambien las funciones, la normativa o los acuerdos con proveedores. El uso continuo de la plataforma implica aceptar la version vigente.
                        </p>
                        <p>
                            Si no aceptas estos terminos, debes dejar de usar la plataforma y solicitar apoyo para exportar o cancelar tu informacion cuando proceda.
                        </p>
                        <p>
                            Revisa tambien el <Link href="/aviso-privacidad" className="text-primary hover:underline">Aviso de Privacidad</Link>.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

