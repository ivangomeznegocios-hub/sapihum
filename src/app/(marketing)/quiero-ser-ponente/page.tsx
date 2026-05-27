import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Banknote, ClipboardCheck, FileText, LockKeyhole, Mic2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPageTitle } from '@/lib/brand'
import { SpeakerApplicationForm } from './speaker-application-form'

export const metadata = {
    title: formatPageTitle('Ser ponente'),
    description: 'Registra tu perfil profesional para impartir eventos, cursos y formaciones dentro de SAPIHUM.',
}

const REQUIREMENTS = [
    'Identidad profesional verificable y datos de contacto reales.',
    'Cedula, registro profesional o credencial equivalente.',
    'Especialidad clara, experiencia minima y propuesta academica coherente.',
    'Bio, foto profesional y aceptacion de terminos de ponente.',
]

const STEPS = [
    {
        title: 'Registro interno',
        description: 'Si cumples los requisitos minimos, se crea tu cuenta con rol de ponente y perfil privado.',
        icon: ClipboardCheck,
    },
    {
        title: 'Carga de eventos',
        description: 'Desde el dashboard puedes preparar eventos, formaciones y materiales para revision operativa.',
        icon: Mic2,
    },
    {
        title: 'Publicacion controlada',
        description: 'El directorio publico y los eventos visibles quedan sujetos a revision y publicacion por admin.',
        icon: ShieldCheck,
    },
]

const TERMS = [
    'El acceso como ponente no garantiza publicacion publica inmediata.',
    'Los porcentajes pueden ajustarse por evento cuando exista una regla aprobada por administracion.',
    'Las ventas, reembolsos y pagos se calculan con los registros internos de la plataforma.',
    'Debes respetar derechos de autor, confidencialidad, criterios academicos y lineamientos de comunicacion profesional.',
]

export default function BecomeSpeakerPage() {
    return (
        <div className="bg-background text-foreground">
            <section className="relative isolate flex min-h-[74svh] items-end overflow-hidden">
                <Image
                    src="/investigacion/sapihum-2025/figura-5-demanda-vs-ingreso.png"
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover opacity-45"
                />
                <div className="absolute inset-0 bg-slate-950/70" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

                <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
                    <div className="max-w-3xl text-white">
                        <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-sky-200">
                            Convocatoria para ponentes
                        </p>
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                            Comparte tu experiencia profesional en SAPIHUM
                        </h1>
                        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
                            Registra tu perfil para impartir eventos, talleres y formaciones. Si cumples los requisitos,
                            activamos tu acceso interno como ponente y dejamos tu perfil listo para revision.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="font-semibold">
                                <a href="#registro">
                                    Iniciar registro
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="border-white/35 bg-white/10 font-semibold text-white hover:bg-white/20 hover:text-white">
                                <Link href="/speakers">Ver ponentes actuales</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid content-end gap-3 text-white sm:grid-cols-3 lg:grid-cols-1">
                        {[
                            ['80%', 'para venta directa atribuida al ponente'],
                            ['50%', 'para venta por canal SAPIHUM'],
                            ['Privado', 'perfil publico sujeto a aprobacion'],
                        ].map(([value, label]) => (
                            <div key={value} className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                                <p className="text-3xl font-bold">{value}</p>
                                <p className="mt-1 text-sm leading-5 text-slate-200">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Requisitos</p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight">Alta automatica con control profesional</h2>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        El sistema valida datos minimos declarados. La verificacion documental y publicacion publica
                        quedan para administracion, para mantener calidad academica y consistencia de marca.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {REQUIREMENTS.map((requirement) => (
                        <div key={requirement} className="flex gap-3 rounded-md border border-brand-border bg-card p-4">
                            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                            <p className="text-sm leading-6 text-muted-foreground">{requirement}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-brand-border bg-card/45">
                <div className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
                    {STEPS.map((step) => {
                        const Icon = step.icon
                        return (
                            <Card key={step.title} className="rounded-md border-brand-border shadow-sm">
                                <CardHeader>
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand-blue-soft text-brand-blue">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-lg">{step.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Ingresos</p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight">Como se calculan tus ingresos</h2>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        Las ventas se registran por evento y origen. Cada calculo queda congelado con la regla vigente
                        al momento de la compra, para que el historial financiero sea auditable.
                    </p>
                </div>
                <div className="grid gap-4">
                    <div className="rounded-md border border-brand-border bg-card p-5">
                        <div className="flex items-center gap-3">
                            <Banknote className="h-5 w-5 text-brand-blue" />
                            <h3 className="font-semibold">Venta directa del ponente</h3>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Cuando la compra llega por tu enlace atribuido, la regla global actual asigna 80% para ti
                            y 20% para SAPIHUM.
                        </p>
                    </div>
                    <div className="rounded-md border border-brand-border bg-card p-5">
                        <div className="flex items-center gap-3">
                            <Banknote className="h-5 w-5 text-brand-blue" />
                            <h3 className="font-semibold">Venta por canal SAPIHUM</h3>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Cuando la venta proviene de la audiencia o campanas de SAPIHUM, la regla global actual
                            asigna 50% para ti y 50% para la plataforma.
                        </p>
                    </div>
                    <div className="rounded-md border border-brand-border bg-card p-5">
                        <div className="flex items-center gap-3">
                            <LockKeyhole className="h-5 w-5 text-brand-blue" />
                            <h3 className="font-semibold">Liberacion y solicitud de pago</h3>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Tus ganancias aparecen en el dashboard, se liberan conforme a las reglas operativas
                            existentes y pueden solicitarse desde el modulo de ganancias.
                        </p>
                    </div>
                </div>
            </section>

            <section className="border-y border-brand-border bg-card/45">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Terminos clave</p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight">Condiciones antes de registrarte</h2>
                        <p className="mt-4 text-sm leading-7 text-muted-foreground">
                            Este resumen no sustituye los documentos legales completos. Al registrarte aceptas la
                            version vigente de terminos, privacidad y reglas comerciales para ponentes.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button asChild variant="outline">
                                <Link href="/terminos">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Terminos
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/aviso-privacidad">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Privacidad
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <ul className="grid gap-3">
                        {TERMS.map((term) => (
                            <li key={term} className="flex gap-3 rounded-md border border-brand-border bg-background p-4">
                                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                                <span className="text-sm leading-6 text-muted-foreground">{term}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section id="registro" className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Registro</p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight">Completa tu solicitud de ponente</h2>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        Si el formulario cumple los requisitos, recibiras confirmacion por correo. Al validar tu email,
                        el sistema activara tu acceso interno como ponente y tu perfil quedara privado.
                    </p>
                </div>
                <SpeakerApplicationForm />
            </section>
        </div>
    )
}
