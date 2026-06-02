import Link from 'next/link'
import { 
    ArrowRight, 
    BadgeCheck, 
    Banknote, 
    ClipboardCheck, 
    FileText, 
    LockKeyhole, 
    Mic2, 
    ShieldCheck, 
    Award, 
    Sparkles, 
    Users, 
    GraduationCap, 
    TrendingUp, 
    HelpCircle, 
    Coins, 
    CheckCircle2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPageTitle } from '@/lib/brand'
import { SpeakerApplicationForm } from './speaker-application-form'

export const metadata = {
    title: formatPageTitle('Convocatoria para Ponentes'),
    description: 'Registra tu perfil profesional como ponente científico para impartir cursos, talleres y masterclasses en la comunidad de psicología SAPIHUM.',
}

const STEPS = [
    {
        title: '1. Solicitud y Validación',
        description: 'Completa el formulario profesional. Nuestro comité académico revisa tus credenciales y activa tu cuenta de ponente en estado privado de forma ágil.',
        icon: ClipboardCheck,
    },
    {
        title: '2. Configuración del Evento',
        description: 'Accede a tu dashboard de ponente privado para diseñar tu propuesta (talleres, webinars o formaciones), fijar el precio y subir los materiales de apoyo.',
        icon: Mic2,
    },
    {
        title: '3. Lanzamiento y Difusión',
        description: 'Una vez aprobado el contenido por administración, el evento se publica en el directorio global. Recibes soporte de cobro, correos automatizados y difusión.',
        icon: ShieldCheck,
    },
]

const TERMS = [
    'La aprobación como ponente interno no implica la publicación comercial inmediata de cualquier evento propuesto.',
    'Los márgenes financieros estándares pueden ser modificados por acuerdo mutuo en casos de campañas institucionales especiales.',
    'La gestión de devoluciones, inscripciones y reportes financieros se realiza de forma centralizada a través del dashboard de SAPIHUM.',
    'El ponente garantiza que todo el material didáctico respeta estrictamente los derechos de autor y los lineamientos éticos de la profesión.'
]

const FAQS = [
    {
        q: '¿Es necesario ser psicólogo clínico para postularse?',
        a: 'No necesariamente. Aceptamos investigadores, neurocientíficos, psiquiatras y profesionales afines a las ciencias de la conducta humana, siempre que cuenten con cédula profesional válida y experiencia demostrable en su área.'
    },
    {
        q: '¿Cómo y cuándo recibo los pagos de mis talleres?',
        a: 'Tus ganancias se acumulan y registran automáticamente por cada transacción en el dashboard. Los fondos correspondientes se liberan según las políticas operativas habituales tras la impartición del evento y puedes solicitar la transferencia con un solo clic.'
    },
    {
        q: '¿Quién define el precio de las formaciones?',
        a: 'Tú tienes la flexibilidad de sugerir el precio de tus talleres o cursos. El equipo académico de SAPIHUM te brindará asesoría basada en la demanda del mercado para maximizar las inscripciones sin comprometer el valor científico del programa.'
    },
    {
        q: '¿Qué tipo de apoyo de marketing ofrece SAPIHUM?',
        a: 'Contamos con una comunidad activa de miles de profesionales de la psicología. Además de la presencia en nuestro directorio oficial, invertimos en publicidad segmentada, campañas de email marketing y difusión cross-channel para los eventos que aplican al canal de ventas de la plataforma.'
    },
    {
        q: '¿También gano si mi contenido está incluido en una membresía?',
        a: 'Sí. Cuando un miembro activo consume tu contenido, se calcula una comisión proporcional tomando como base hasta el 50% de su plan mensual. El monto se distribuye según los contenidos consumidos en el mes y el número de ponentes participantes.'
    }
]

export default function BecomeSpeakerPage() {
    return (
        <div className="bg-background text-foreground sapihum-neural-dots relative overflow-hidden pb-16">
            
            {/* HERO SECTION */}
            <section className="relative isolate min-h-[92vh] flex items-center justify-center overflow-hidden border-b border-brand-border py-20 lg:py-32">
                {/* Background Image of a large conference/audience with blend mode */}
                <div 
                    className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.08] pointer-events-none z-0 mix-blend-luminosity" 
                />
                {/* Visual Grid and glowing blobs */}
                <div className="absolute inset-0 sapihum-grid-bg opacity-60 pointer-events-none z-0" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse" />
                
                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
                    <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center">
                        
                        <div className="max-w-3xl text-left sapihum-stagger">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-brand-blue-soft border border-brand-blue-border text-brand-blue-dark mb-6">
                                <Sparkles className="h-3.5 w-3.5" /> Convocatoria Académica 2026
                            </span>
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-brand-text-strong leading-[1.1]">
                                Multiplica tu impacto científico como <span className="bg-gradient-to-r from-brand-blue via-indigo-600 to-sky-500 bg-clip-text text-transparent sapihum-shimmer-text">Ponente SAPIHUM</span>
                            </h1>
                            <p className="mt-6 text-base leading-8 text-brand-text-muted sm:text-lg max-w-xl">
                                Comparte tu especialidad con la mayor red de profesionales de la salud mental y ciencias del comportamiento. Obtén hasta un 80% de ganancias, soporte técnico total y certificación oficial para tus alumnos.
                            </p>
                            
                            <div className="mt-8 flex flex-wrap gap-4">
                                <Button asChild size="lg" className="sapihum-glow-cta bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-base px-8 py-6 rounded-md shadow-brand-base">
                                    <a href="#registro">
                                        Postularme ahora
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="border-brand-border bg-white text-brand-text-strong font-semibold hover:bg-brand-surface-soft px-8 py-6 rounded-md">
                                    <Link href="/speakers">Ver ponentes activos</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Visual Right Column - Commission Badges */}
                        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                            {[
                                {
                                    value: '80%',
                                    title: 'Venta directa propia',
                                    desc: 'Recibe el 80% cuando tú generas la venta de tu curso, taller o contenido.',
                                    color: 'border-l-4 border-l-brand-blue'
                                },
                                {
                                    value: '50%',
                                    title: 'Venta por canal SAPIHUM',
                                    desc: 'Recibe el 50% cuando la venta llega a través de la comunidad, campañas o canales de SAPIHUM.',
                                    color: 'border-l-4 border-l-indigo-600'
                                },
                                {
                                    value: 'Hasta 50%',
                                    title: 'Consumo por membresía',
                                    desc: 'Recibe una comisión proporcional cuando miembros activos consumen tu contenido dentro de su membresía.',
                                    color: 'border-l-4 border-l-sky-500'
                                }
                            ].map((badge, idx) => (
                                <div 
                                    key={idx} 
                                    className={`rounded-xl border border-brand-border bg-white/80 p-6 backdrop-blur shadow-brand-base sapihum-card-glow transition-transform hover:-translate-y-1 ${badge.color}`}
                                >
                                    <p className="text-4xl font-extrabold text-brand-text-strong tracking-tight">{badge.value}</p>
                                    <p className="mt-2 text-base font-bold text-brand-text-strong">{badge.title}</p>
                                    <p className="mt-1 text-xs text-brand-text-muted leading-relaxed">{badge.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* BENEFITS SECTION */}
            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="brand-eyebrow">EL VALOR DE SER PARTE</span>
                    <h2 className="text-3xl font-extrabold text-brand-text-strong tracking-tight sm:text-4xl mt-3">
                        Todo lo que necesitas para brillar como docente científico
                    </h2>
                    <p className="mt-4 text-base text-brand-text-muted">
                        Nos ocupamos de la complejidad operativa y técnica para que puedas enfocarte exclusivamente en transmitir tu experiencia clínica y académica.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            title: 'Audiencia Especializada',
                            desc: 'Accede directamente a miles de profesionales de la salud mental que buscan actualización constante y rigurosa.',
                            icon: Users
                        },
                        {
                            title: 'Respaldo Curricular',
                            desc: 'Tus formaciones contarán con aval oficial de SAPIHUM, elevando el prestigio académico de tu oferta formativa.',
                            icon: GraduationCap
                        },
                        {
                            title: 'Infraestructura Tecnológica',
                            desc: 'Pasarela de pagos internacional integrada, emisión automática de certificados y soporte técnico en tiempo real.',
                            icon: Award
                        },
                        {
                            title: 'Monetización Transparente',
                            desc: 'Acceso a un panel detallado de analíticas de ventas y cobros simplificados con el porcentaje más alto del sector.',
                            icon: TrendingUp
                        }
                    ].map((benefit, idx) => {
                        const Icon = benefit.icon
                        return (
                            <div 
                                key={idx} 
                                className="relative rounded-xl border border-brand-border bg-white p-6 shadow-brand-base sapihum-card-glow"
                            >
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-blue-soft text-brand-blue">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-brand-text-strong">{benefit.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">{benefit.desc}</p>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* VIDEO TUTORIAL SECTION */}
            <section className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="relative rounded-2xl border border-brand-border bg-white/80 p-6 md:p-8 backdrop-blur shadow-brand-luxury overflow-hidden sapihum-card-glow">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-blue/10 rounded-full blur-[80px] pointer-events-none z-0" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none z-0" />
                    
                    <div className="grid gap-8 lg:grid-cols-12 items-center relative z-10">
                        <div className="lg:col-span-5 text-left space-y-4">
                            <span className="brand-eyebrow">VIDEO EXPLICATIVO</span>
                            <h3 className="text-2xl font-extrabold text-brand-text-strong tracking-tight sm:text-3xl">
                                ¿Cómo ser ponente en SAPIHUM?
                            </h3>
                            <p className="text-sm text-brand-text-muted leading-relaxed">
                                En este video te explicamos paso a paso cómo registrar tu perfil, estructurar tu propuesta académica y aprovechar nuestro canal de ventas para llegar a miles de psicólogos en Hispanoamérica.
                            </p>
                            <div className="space-y-2.5 pt-2">
                                {[
                                    'Requisitos del perfil académico',
                                    'Simulación de ganancias y cobros',
                                    'Cómo subir cursos y masterclasses'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-brand-text-strong font-medium">
                                        <CheckCircle2 className="h-5 w-5 text-brand-blue shrink-0" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="lg:col-span-7">
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-brand-border bg-slate-900 shadow-brand-luxury group">
                                <iframe
                                    src="https://www.youtube.com/embed/mq8jiTVbslw"
                                    title="Cómo aplicar en SAPIHUM"
                                    className="absolute inset-0 w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STEPS FLOW SECTION */}
            <section className="border-y border-brand-border bg-brand-surface-soft/40 py-20 relative overflow-hidden">
                <div className="absolute inset-0 sapihum-grid-bg opacity-30 pointer-events-none" />
                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="brand-eyebrow">EL PROCESO</span>
                        <h2 className="text-3xl font-extrabold text-brand-text-strong tracking-tight sm:text-4xl mt-3">
                            Cómo iniciar tu trayectoria académica
                        </h2>
                        <p className="mt-4 text-base text-brand-text-muted">
                            Un flujo simplificado y transparente diseñado para garantizar el rigor y la calidad sin burocracia excesiva.
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon
                            return (
                                <div key={idx} className="relative rounded-xl border border-brand-border bg-white p-8 shadow-brand-base sapihum-card-glow">
                                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-soft text-brand-blue font-bold">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-brand-text-strong">{step.title}</h3>
                                    <p className="mt-4 text-sm leading-relaxed text-brand-text-muted">{step.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* COMMUNITY & CONFERENCES SHOWCASE */}
            <section className="relative border-t border-brand-border bg-brand-surface-soft/30 py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] pointer-events-none" />
                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 items-center">
                        <div className="space-y-6">
                            <span className="brand-eyebrow">COMUNIDAD Y ALCANCE</span>
                            <h2 className="text-3xl font-extrabold text-brand-text-strong tracking-tight sm:text-4xl">
                                Comparte tu conocimiento ante una audiencia de miles de profesionales
                            </h2>
                            <p className="text-base text-brand-text-muted leading-relaxed">
                                SAPIHUM es el hub líder de educación científica en psicología de Hispanoamérica. Al unirte como ponente, no solo publicas un curso: te posicionas ante una comunidad vibrante y hambrienta de actualización clínica rigurosa.
                            </p>
                            
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="p-4 rounded-xl bg-white border border-brand-border shadow-brand-base">
                                    <p className="text-2xl font-black text-brand-blue">+150</p>
                                    <p className="text-sm font-bold text-brand-text-strong mt-1">Miembros Activos</p>
                                    <p className="text-xs text-brand-text-muted mt-0.5">Psicólogos, terapeutas y estudiantes de toda la región.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white border border-brand-border shadow-brand-base">
                                    <p className="text-2xl font-black text-indigo-600">98%</p>
                                    <p className="text-sm font-bold text-brand-text-strong mt-1">Satisfacción Global</p>
                                    <p className="text-xs text-brand-text-muted mt-0.5">Nuestras masterclasses y talleres son valoradas con excelencia.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-brand-blue to-indigo-600 opacity-10 blur-xl" />
                            
                            <div className="relative rounded-2xl overflow-hidden border border-brand-border bg-white p-2 shadow-brand-luxury">
                                <img 
                                    src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=2070&auto=format&fit=crop" 
                                    alt="Conferencia SAPIHUM" 
                                    className="w-full h-[320px] object-cover rounded-xl"
                                />
                                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/95 backdrop-blur border border-brand-border shadow-brand-base">
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2 shrink-0">
                                            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" alt="User 1" />
                                            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop" alt="User 2" />
                                            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop" alt="User 3" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-extrabold text-brand-text-strong">"La mejor plataforma de actualización científica"</p>
                                            <p className="text-[10px] text-brand-text-muted">Dra. Claudia R. — Ponente de Neuropsicología</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* INCOME TRANPARENCY SECTION */}
            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] items-center">
                    <div>
                        <span className="brand-eyebrow">TRANSPARENCIA FINANCIERA</span>
                        <h2 className="text-3xl font-extrabold text-brand-text-strong tracking-tight sm:text-4xl mt-3">
                            Un modelo de comisiones claro y justo
                        </h2>
                        <p className="mt-4 text-base text-brand-text-muted leading-relaxed">
                            Las inscripciones a tus formaciones se gestionan de forma automática en nuestra plataforma. El origen de cada venta determina el porcentaje asignado para asegurar un ecosistema de crecimiento mutuo.
                        </p>
                        
                        {/* Interactive Example Box */}
                        <div className="mt-8 rounded-xl border border-brand-blue-border bg-brand-blue-soft/50 p-6">
                            <h4 className="flex items-center gap-2 font-bold text-brand-text-strong text-base">
                                <Coins className="h-5 w-5 text-brand-blue-dark" /> Simulación de ingresos
                            </h4>
                            <p className="mt-3 text-sm text-brand-text-muted leading-relaxed">
                                Si organizas un taller práctico con un costo de <strong>$50 USD</strong> y asisten <strong>30 alumnos</strong>:
                            </p>
                            <ul className="mt-4 space-y-2 border-t border-brand-blue-border/40 pt-4 text-sm text-brand-text-strong">
                                <li className="flex justify-between">
                                    <span>15 inscritos por tu red (Venta Directa - 80%):</span>
                                    <strong>$600.00 USD</strong>
                                </li>
                                <li className="flex justify-between">
                                    <span>15 inscritos por difusión de SAPIHUM (50%):</span>
                                    <strong>$375.00 USD</strong>
                                </li>
                                <li className="flex justify-between border-t border-brand-blue-border/50 pt-2 font-extrabold text-base text-brand-blue-dark">
                                    <span>Tus ganancias totales:</span>
                                    <span>$975.00 USD</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {[
                            {
                                title: 'Venta Directa Atribuida (80% para ti)',
                                desc: 'Cuando la compra llega directamente por tu enlace único de ponente, código promocional o red personal. Recibes la gran mayoría de la inscripción.',
                                icon: Banknote
                            },
                            {
                                title: 'Venta por Canales SAPIHUM (50% para ti)',
                                desc: 'Cuando el estudiante te descubre de forma orgánica en nuestro directorio, correos electrónicos a suscriptores o gracias a nuestras campañas pagadas en redes.',
                                icon: Users
                            },
                            {
                                title: 'Consumo por membresía',
                                desc: (
                                    <>
                                        Tus contenidos también pueden generar ingresos cuando son consumidos por miembros activos de SAPIHUM. Se asigna hasta el 50% proporcional del plan mensual del miembro, distribuido según los contenidos que consuma durante el mes.
                                        <span className="block mt-2 text-xs italic text-brand-blue-dark font-medium">
                                            “Mientras más valor genere tu contenido dentro de la comunidad, más oportunidades tienes de monetizarlo.”
                                        </span>
                                    </>
                                ),
                                icon: Coins
                            },
                            {
                                title: 'Retiros Simples y transparentes',
                                desc: 'Los estados de cuenta e ingresos se congelan con la regla comercial vigente en el momento de la venta para garantizar auditoría. Retira tus ganancias de forma directa desde tu panel.',
                                icon: LockKeyhole
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="flex gap-4 rounded-xl border border-brand-border bg-white p-6 shadow-brand-base sapihum-card-glow">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue-soft text-brand-blue">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-text-strong text-base">{item.title}</h3>
                                    <p className="mt-2 text-sm text-brand-text-muted leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQS SECTION */}
            <section className="border-t border-brand-border bg-brand-surface-soft/20 py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="brand-eyebrow">PREGUNTAS FRECUENTES</span>
                        <h2 className="text-3xl font-extrabold text-brand-text-strong tracking-tight sm:text-4xl mt-3">
                            Resolviendo tus inquietudes académicas
                        </h2>
                        <p className="mt-4 text-base text-brand-text-muted">
                            Si tienes alguna otra duda sobre el proceso, no dudes en contactar a nuestro equipo de soporte institucional.
                        </p>
                    </div>

                    <div className="mx-auto max-w-4xl grid gap-6 sm:grid-cols-2">
                        {FAQS.map((faq, idx) => (
                            <div key={idx} className="rounded-xl border border-brand-border bg-white p-6 shadow-brand-base">
                                <h3 className="flex items-start gap-2.5 font-bold text-brand-text-strong text-base">
                                    <HelpCircle className="h-5 w-5 shrink-0 text-brand-blue mt-0.5" />
                                    <span>{faq.q}</span>
                                </h3>
                                <p className="mt-3 text-sm text-brand-text-muted leading-relaxed pl-7.5">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* LEGAL TERMS SECTION */}
            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-brand-border">
                <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
                    <div>
                        <span className="brand-eyebrow">MARCO ÉTICO Y LEGAL</span>
                        <h2 className="text-3xl font-extrabold text-brand-text-strong tracking-tight sm:text-4xl mt-3">
                            Términos institucionales clave
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed text-brand-text-muted">
                            Para velar por el rigor del hub, todos los ponentes deben aceptar el acuerdo marco de colaboración docente al momento de crear su perfil profesional. Puedes consultar las políticas detalladas en cualquier momento.
                        </p>
                        
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button asChild variant="outline" className="border-brand-border bg-white hover:bg-brand-surface-soft">
                                <Link href="/terminos">
                                    <FileText className="mr-2 h-4 w-4 text-brand-blue" />
                                    Términos del Servicio
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="border-brand-border bg-white hover:bg-brand-surface-soft">
                                <Link href="/aviso-privacidad">
                                    <FileText className="mr-2 h-4 w-4 text-brand-blue" />
                                    Aviso de Privacidad
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <ul className="grid gap-4">
                        {TERMS.map((term, idx) => (
                            <li key={idx} className="flex gap-4 rounded-xl border border-brand-border bg-white p-5 shadow-brand-base">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                                <span className="text-sm leading-relaxed text-brand-text-muted">{term}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* REGISTRATION FORM WRAPPER */}
            <section id="registro" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-brand-border scroll-mt-10">
                <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
                    <div className="lg:sticky lg:top-28 self-start">
                        <span className="brand-eyebrow">REGISTRO DOCENTE</span>
                        <h2 className="text-3xl font-extrabold text-brand-text-strong tracking-tight sm:text-4xl mt-3">
                            Únete hoy a SAPIHUM
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-brand-text-muted">
                            Completa tu solicitud profesional y carga tus credenciales académicas. Una vez enviado el formulario, recibirás un correo de verificación para activar tu cuenta de ponente interna.
                        </p>
                        
                        <div className="mt-8 rounded-xl border border-brand-border bg-white p-6 shadow-brand-base flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                                <BadgeCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-brand-text-strong text-sm">Validación ágil de perfil</h4>
                                <p className="mt-2 text-xs text-brand-text-muted leading-relaxed">
                                    El alta de tu cuenta como ponente se realiza al validar tu correo, permitiéndote explorar el creador de eventos y dashboard de inmediato.
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-6 rounded-xl overflow-hidden border border-brand-border bg-white p-2 shadow-brand-base">
                            <img 
                                src="https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?q=80&w=2070&auto=format&fit=crop" 
                                alt="Docentes en acción" 
                                className="w-full h-[180px] object-cover rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="relative rounded-2xl border border-brand-border bg-white p-1 md:p-2 shadow-brand-luxury backdrop-blur">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/5 to-indigo-600/5 rounded-2xl pointer-events-none" />
                        <SpeakerApplicationForm />
                    </div>
                </div>
            </section>
        </div>
    )
}
