'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    ArrowRight,
    BadgeCheck,
    BookOpen,
    CalendarDays,
    Check,
    ChevronDown,
    Clock,
    Crown,
    Loader2,
    MessageCircle,
    Network,
    ShieldCheck,
    Sparkles,
    Users,
    Vote,
    X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { collectAnalyticsEvent, getClientAnalyticsContext } from '@/lib/analytics/client'

const benefits = [
    ['Comunidad privada', 'Acceso a un espacio profesional para conectar con otros psicologos, estudiantes avanzados y profesionales del area.', Users],
    ['Agenda mensual', 'Actividades, sesiones y encuentros programados durante el mes.', CalendarDays],
    ['Sesiones seleccionadas', 'Acceso a sesiones en vivo seleccionadas para miembros.', BookOpen],
    ['Networking profesional', 'Espacios para conocer colegas, compartir intereses y abrir nuevas conexiones.', Network],
    ['Recursos y materiales', 'Acceso a materiales, recursos y contenidos seleccionados para miembros.', ShieldCheck],
    ['Rutas de especializacion', 'Acceso preferencial a rutas, formaciones y programas especializados.', Sparkles],
    ['Votacion de temas', 'Participacion en la eleccion de proximos temas, sesiones y areas de interes.', Vote],
    ['Prioridad de cupo', 'Prioridad para actividades con cupo limitado.', BadgeCheck],
] as const

const founderBenefits = [
    ['Precio fundador de $250 MXN/mes', 'Los primeros 100 miembros conservan el precio fundador mientras mantengan activa su membresia.'],
    ['Prioridad en actividades con cupo limitado', 'Tendras prioridad para registrarte en sesiones, talleres o encuentros donde los lugares sean limitados.'],
    ['2 sesiones premium incluidas en mayo', 'Como bono de lanzamiento, los miembros fundadores tendran acceso incluido a 2 sesiones premium seleccionadas durante mayo.'],
    ['Primera generacion nacional', 'Formaras parte de la primera generacion de miembros SAPIHUM Mexico.'],
    ['Participacion en decisiones de comunidad', 'Podras votar o sugerir temas, areas, sesiones y rutas futuras.'],
    ['Beneficios preferenciales en formaciones premium', 'Tendras acceso a precios o condiciones preferenciales en formaciones, rutas y programas seleccionados.'],
] as const

const areas = [
    'Psicologia clinica',
    'Psicologia forense',
    'Conducta criminal',
    'Duelo',
    'Trauma',
    'Adicciones',
    'Memoria y vejez',
    'Intervencion',
    'Networking profesional',
    'Desarrollo profesional',
]

const profileOptions = [
    'Psicologo/a',
    'Estudiante de psicologia',
    'Psicoterapeuta',
    'Criminologo/a',
    'Docente',
    'Profesional afin',
    'Otro',
]

const interestOptions = [
    'Clinica',
    'Forense',
    'Duelo',
    'Trauma',
    'Adicciones',
    'Memoria y vejez',
    'Comunidad / networking',
    'Otra',
]

const faqs = [
    ['¿La membresia cuesta $250 o $290?', 'La membresia regular cuesta $290 MXN al mes. Durante el lanzamiento abrimos un precio fundador de $250 MXN mensuales para los primeros 100 miembros.'],
    ['¿Conservo el precio de $250?', 'Si. Conservas el precio fundador mientras mantengas activa tu membresia. Si cancelas y despues deseas volver, aplicaras al precio vigente de ese momento.'],
    ['¿Puedo cancelar?', 'Si. La membresia es mensual y puedes cancelarla cuando lo necesites.'],
    ['¿Incluye todas las formaciones premium?', 'La membresia incluye comunidad, agenda mensual, sesiones seleccionadas, networking, recursos y beneficios para miembros. Algunas formaciones premium, rutas o programas especializados pueden tener costo adicional, pero los miembros tendran acceso preferencial o beneficios especiales.'],
    ['¿Que son las sesiones premium incluidas?', 'Durante mayo, los miembros fundadores tendran acceso incluido a 2 sesiones premium seleccionadas como bono de lanzamiento.'],
    ['¿Es solo para psicologos titulados?', 'No necesariamente. Tambien pueden entrar estudiantes avanzados de psicologia, psicoterapeutas, profesionales de salud mental y perfiles afines interesados en formacion continua y comunidad profesional.'],
    ['¿SAPIHUM ofrece terapia psicologica?', 'No. SAPIHUM es una comunidad de formacion, networking y desarrollo profesional. No sustituye atencion psicologica, supervision clinica formal ni procesos terapeuticos.'],
    ['¿Las sesiones quedan grabadas?', 'Algunas sesiones podran estar disponibles para miembros, dependiendo del tipo de actividad y autorizacion del ponente. Los detalles se comunicaran en cada actividad.'],
    ['¿Que pasa si se llenan los 100 lugares?', 'Al llenarse los primeros 100 lugares fundadores, el acceso continuara bajo las condiciones regulares de membresia.'],
    ['¿Puedo entrar desde cualquier ciudad de Mexico?', 'Si. SAPIHUM es una comunidad online para profesionales de Mexico y, mas adelante, de habla hispana en otros paises.'],
] as const

function trackCta(location: string) {
    return collectAnalyticsEvent('cta_clicked', {
        properties: {
            eventName: 'founder_cta_click',
            campaign: 'founders_mx_2026',
            location,
            targetPlan: 'founders_mx_2026',
        },
        touch: {
            funnel: 'landing',
            landingPath: '/fundadores-mexico',
            targetPlan: 'founders_mx_2026',
        },
    })
}

function SectionHeader({
    eyebrow,
    title,
    text,
}: {
    eyebrow?: string
    title: string
    text?: string
}) {
    return (
        <div className="mx-auto max-w-3xl text-center">
            {eyebrow && (
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d89f2b]">
                    {eyebrow}
                </p>
            )}
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                {title}
            </h2>
            {text && <p className="mt-5 text-base leading-7 text-stone-300/75 md:text-lg">{text}</p>}
        </div>
    )
}

function FounderCheckoutButton({
    location,
    label = 'Entrar como miembro fundador',
    className = '',
}: {
    location: string
    label?: string
    className?: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [guestOpen, setGuestOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')

    async function startCheckout(withGuestDetails = false) {
        setIsLoading(true)
        setError(null)

        try {
            await trackCta(location)
            await collectAnalyticsEvent('checkout_started', {
                properties: {
                    eventName: 'founder_checkout_start',
                    campaign: 'founders_mx_2026',
                    purchaseType: 'subscription_payment',
                    membershipLevel: 1,
                    billingInterval: 'monthly',
                    founderPrice: 250,
                    regularPrice: 290,
                    location,
                },
                touch: {
                    funnel: 'checkout',
                    landingPath: '/fundadores-mexico',
                    targetPlan: 'founders_mx_2026',
                },
            })

            const analyticsContext = getClientAnalyticsContext({
                funnel: 'checkout',
                landingPath: '/fundadores-mexico',
                targetPlan: 'founders_mx_2026',
            })

            const response = await fetch('/api/payments/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    membershipLevel: 1,
                    billingInterval: 'monthly',
                    offerCode: 'founders_mx_2026',
                    analyticsContext,
                    successPath: '/dashboard/subscription',
                    ...(withGuestDetails ? { email, fullName } : {}),
                }),
            })

            const data = await response.json()
            if (!response.ok) {
                if (response.status === 401 || data.requiresGuestDetails) {
                    setGuestOpen(true)
                    return
                }
                setError(data.error || 'No fue posible iniciar el pago')
                return
            }

            window.location.href = data.checkoutUrl
        } catch (checkoutError) {
            console.error('[Founders] checkout error:', checkoutError)
            setError('Error inesperado al iniciar el pago')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className={className}>
                <Button
                    type="button"
                    size="lg"
                    className="w-full rounded-full bg-[#f1b541] px-7 text-black hover:bg-[#ffd778]"
                    onClick={() => startCheckout(false)}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                    {isLoading ? 'Abriendo checkout...' : label}
                    {!isLoading && <ArrowRight className="h-4 w-4" />}
                </Button>
                {error && <p className="mt-2 text-center text-xs font-medium text-red-300">{error}</p>}
            </div>

            {guestOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11100d] p-6 text-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d89f2b]">
                                    Continua al pago
                                </p>
                                <h3 className="mt-2 text-2xl font-semibold">Datos para tu checkout</h3>
                                <p className="mt-2 text-sm leading-6 text-stone-300/70">
                                    Usaremos estos datos para crear tu checkout de miembro fundador.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="rounded-full border border-white/10 p-2 text-stone-300 hover:text-white"
                                onClick={() => setGuestOpen(false)}
                                aria-label="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form
                            className="mt-6 space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault()
                                startCheckout(true)
                            }}
                        >
                            <label className="block text-sm font-medium text-stone-200">
                                Nombre completo
                                <Input
                                    className="mt-2 border-white/10 bg-white/[0.04] text-white"
                                    value={fullName}
                                    onChange={(event) => setFullName(event.target.value)}
                                    required
                                />
                            </label>
                            <label className="block text-sm font-medium text-stone-200">
                                Correo electronico
                                <Input
                                    className="mt-2 border-white/10 bg-white/[0.04] text-white"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                />
                            </label>
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full rounded-full bg-[#f1b541] text-black hover:bg-[#ffd778]"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                Ir al checkout
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

function CalendarLeadForm() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    async function submitLead(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatus('loading')
        setMessage('')

        const form = new FormData(event.currentTarget)
        const analyticsContext = getClientAnalyticsContext({
            funnel: 'landing',
            landingPath: '/fundadores-mexico',
            targetPlan: 'founders_mx_2026',
        })

        await collectAnalyticsEvent('form_submit', {
            properties: {
                eventName: 'calendar_download_click',
                campaign: 'founders_mx_2026',
                form: 'founder_calendar_request',
            },
            touch: {
                funnel: 'landing',
                landingPath: '/fundadores-mexico',
                targetPlan: 'founders_mx_2026',
            },
        })

        const response = await fetch('/api/leads/founders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: form.get('fullName'),
                email: form.get('email'),
                whatsapp: form.get('whatsapp'),
                location: form.get('location'),
                professionalProfile: form.get('professionalProfile'),
                interestArea: form.get('interestArea'),
                consent: form.get('consent') === 'on',
                analyticsContext,
            }),
        })

        const data = await response.json()
        if (!response.ok) {
            setStatus('error')
            setMessage(data.error || 'No fue posible enviar tus datos')
            return
        }

        await collectAnalyticsEvent('generate_lead', {
            properties: {
                eventName: 'founder_lead_submit',
                campaign: 'founders_mx_2026',
                form: 'founder_calendar_request',
            },
            touch: {
                funnel: 'landing',
                landingPath: '/fundadores-mexico',
                targetPlan: 'founders_mx_2026',
            },
        })

        setStatus('success')
        setMessage(data.message)
        event.currentTarget.reset()
    }

    return (
        <form className="grid gap-4" onSubmit={submitLead}>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-stone-100">
                    Nombre completo
                    <Input name="fullName" required className="mt-2 border-white/10 bg-white/[0.04] text-white" />
                </label>
                <label className="text-sm font-medium text-stone-100">
                    Correo electronico
                    <Input name="email" type="email" required className="mt-2 border-white/10 bg-white/[0.04] text-white" />
                </label>
                <label className="text-sm font-medium text-stone-100">
                    WhatsApp
                    <Input name="whatsapp" required className="mt-2 border-white/10 bg-white/[0.04] text-white" />
                </label>
                <label className="text-sm font-medium text-stone-100">
                    Ciudad / Estado
                    <Input name="location" required className="mt-2 border-white/10 bg-white/[0.04] text-white" />
                </label>
                <label className="text-sm font-medium text-stone-100">
                    Perfil profesional
                    <select
                        name="professionalProfile"
                        required
                        className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#171510] px-3.5 text-sm text-white outline-none focus:border-[#f1b541]"
                        defaultValue=""
                    >
                        <option value="" disabled>Selecciona una opcion</option>
                        {profileOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                </label>
                <label className="text-sm font-medium text-stone-100">
                    Area de interes
                    <select
                        name="interestArea"
                        required
                        className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#171510] px-3.5 text-sm text-white outline-none focus:border-[#f1b541]"
                        defaultValue=""
                    >
                        <option value="" disabled>Selecciona una opcion</option>
                        {interestOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                </label>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-stone-300">
                <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-[#f1b541]" />
                Acepto recibir informacion de SAPIHUM sobre el calendario de mayo, sesiones y acceso fundador.
            </label>

            <Button
                type="submit"
                size="lg"
                className="rounded-full bg-white text-black hover:bg-[#f1b541]"
                disabled={status === 'loading'}
            >
                {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                Recibir calendario de mayo
            </Button>

            {message && (
                <p className={`rounded-2xl p-4 text-sm ${status === 'success' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-red-400/10 text-red-200'}`}>
                    {message}
                </p>
            )}
        </form>
    )
}

export function FundadoresMexicoLanding() {
    const scrollToLeadForm = async () => {
        await collectAnalyticsEvent('cta_clicked', {
            properties: {
                eventName: 'calendar_download_click',
                campaign: 'founders_mx_2026',
                location: 'secondary_cta',
            },
            touch: {
                funnel: 'landing',
                landingPath: '/fundadores-mexico',
                targetPlan: 'founders_mx_2026',
            },
        })
        document.getElementById('calendario-mayo')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[#090806] text-white">
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(241,181,65,0.18),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,#090806,#11100d_38%,#070706)]" />
            <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.9)_1px,transparent_1px)] [background-size:64px_64px]" />

            <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
                <Link
                    href="/fundadores-mexico"
                    className="text-sm font-black uppercase tracking-[0.28em] text-white transition-colors hover:text-[#f1b541]"
                    aria-label="Volver al inicio de Miembros Fundadores SAPIHUM Mexico"
                >
                    SAPIHUM
                </Link>
                <div className="hidden items-center gap-3 text-xs text-stone-300 md:flex">
                    <span>Primeros 100 lugares</span>
                    <span className="h-1 w-1 rounded-full bg-[#f1b541]" />
                    <span>Mayo 2026</span>
                </div>
            </header>

            <section className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-8 md:grid-cols-[1.08fr_0.92fr] md:px-8 md:pb-28 md:pt-14">
                <div className="flex flex-col justify-center">
                    <div className="w-fit rounded-full border border-[#f1b541]/30 bg-[#f1b541]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#f1b541]">
                        Lanzamiento nacional · Mayo 2026 · Mexico
                    </div>
                    <h1 className="mt-7 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white md:text-7xl">
                        Se parte de los primeros 100 miembros fundadores de SAPIHUM Mexico
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-200/80 md:text-xl">
                        Una comunidad profesional para psicologos, estudiantes avanzados y profesionales del area que buscan formacion continua, networking, agenda activa y rutas de especializacion.
                    </p>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-stone-300/65">
                        Durante mayo abrimos la primera generacion nacional de SAPIHUM. Los primeros 100 miembros podran entrar con precio fundador, prioridad en actividades con cupo limitado y beneficios especiales de lanzamiento.
                    </p>

                    <div className="mt-8 grid gap-3 sm:flex">
                        <FounderCheckoutButton location="hero" className="sm:min-w-72" />
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            className="rounded-full border-white/15 bg-white/[0.03]"
                            onClick={scrollToLeadForm}
                        >
                            <CalendarDays className="h-4 w-4" />
                            Recibir calendario de mayo
                        </Button>
                    </div>
                    <p className="mt-4 text-sm text-stone-400">
                        Membresia mensual. Puedes cancelar cuando quieras. Cupo fundador limitado a los primeros 100 miembros.
                    </p>
                </div>

                <aside className="relative">
                    <div className="rounded-[2rem] border border-white/12 bg-white/[0.07] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl md:sticky md:top-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f1b541]">Oferta fundadora</p>
                                <h2 className="mt-3 text-2xl font-semibold">Miembro Fundador SAPIHUM Mexico</h2>
                            </div>
                            <div className="rounded-2xl bg-[#f1b541] p-3 text-black">
                                <Crown className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-7 rounded-3xl bg-black/35 p-5">
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-semibold tracking-tight">$250</span>
                                <span className="pb-2 text-stone-300">MXN/mes</span>
                            </div>
                            <p className="mt-2 text-sm text-stone-400">Precio regular: $290 MXN/mes</p>
                        </div>
                        <ul className="mt-6 space-y-3 text-sm text-stone-200">
                            {['Primeros 100 lugares', '2 sesiones premium incluidas en mayo', 'Prioridad en actividades con cupo limitado', 'Conservas el precio mientras tu membresia siga activa'].map((item) => (
                                <li key={item} className="flex gap-3">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f1b541]" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <FounderCheckoutButton location="hero_card" label="Asegurar mi lugar fundador" className="mt-7" />
                    </div>
                </aside>
            </section>

            <section className="relative z-10 border-y border-white/10 bg-black/20 px-5 py-20 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <SectionHeader title="La formacion profesional no deberia sentirse tan aislada" />
                    <div className="mt-12 grid gap-8 md:grid-cols-[0.95fr_1.05fr]">
                        <p className="text-xl leading-9 text-stone-200/80">
                            Muchos psicologos avanzan profesionalmente con una sensacion comun: tienen teoria, interes y vocacion, pero no siempre tienen comunidad, actualizacion constante, espacios de practica, networking o una ruta clara para especializarse.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {['Hay cursos sueltos, pero poca continuidad.', 'Hay informacion dispersa, pero poca curaduria profesional.', 'Hay muchos profesionales avanzando solos.', 'Hay pocas comunidades activas con agenda real.'].map((item) => (
                                <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-stone-200">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="mt-8 rounded-3xl border border-[#f1b541]/20 bg-[#f1b541]/10 p-6 text-lg leading-8 text-[#ffe0a2]">
                        SAPIHUM nace para unir formacion, comunidad, agenda profesional y especializacion en un solo ecosistema.
                    </p>
                </div>
            </section>

            <section className="relative z-10 px-5 py-20 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <SectionHeader
                        eyebrow="Que es SAPIHUM"
                        title="Una comunidad profesional viva, no solo una plataforma de cursos"
                        text="SAPIHUM es una comunidad profesional de formacion continua, eventos, networking y rutas de especializacion para psicologos y profesionales del area."
                    />
                    <div className="mt-12 grid gap-4 md:grid-cols-4">
                        {[
                            ['Formacion continua', 'Sesiones, talleres, rutas, eventos y contenidos especializados.'],
                            ['Comunidad profesional', 'Espacios para conectar con colegas, compartir intereses y generar red.'],
                            ['Agenda activa', 'Actividades mensuales para que siempre haya algo nuevo que aprender o explorar.'],
                            ['Especializacion', 'Areas como psicologia clinica, forense, duelo, trauma, adicciones, memoria, vejez, intervencion y mas.'],
                        ].map(([title, text], index) => (
                            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
                                <span className="text-sm font-bold text-[#f1b541]">0{index + 1}</span>
                                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                                <p className="mt-3 text-sm leading-6 text-stone-300/70">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative z-10 bg-[#f1b541] px-5 py-20 text-black md:px-8">
                <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.95fr_1.05fr]">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em]">Oferta fundadora</p>
                        <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
                            Primeros 100 Miembros Fundadores SAPIHUM Mexico
                        </h2>
                        <p className="mt-6 text-lg leading-8 text-black/75">
                            Durante mayo abrimos una etapa especial para formar la primera comunidad nacional de SAPIHUM. Los primeros 100 miembros podran entrar con precio fundador de $250 MXN mensuales y conservarlo mientras mantengan activa su membresia.
                        </p>
                        <FounderCheckoutButton location="offer" className="mt-8 max-w-sm" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {[
                            ['Cupo fundador', 'Primeros 100 miembros'],
                            ['Precio fundador', '$250 MXN/mes'],
                            ['Precio regular', '$290 MXN/mes'],
                            ['Vigencia', 'Durante mayo o hasta llenar los primeros 100 lugares'],
                            ['Renovacion', 'Mensual'],
                            ['Cancelacion', 'Disponible cuando el usuario lo necesite'],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-3xl border border-black/10 bg-black/8 p-5">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-black/50">{label}</p>
                                <p className="mt-3 text-lg font-semibold">{value}</p>
                            </div>
                        ))}
                        <div className="rounded-3xl border border-black/10 bg-black p-5 text-white sm:col-span-2">
                            El precio fundador se conserva mientras la membresia siga activa. Si cancelas y deseas volver mas adelante, aplicaras al precio vigente de ese momento.
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative z-10 px-5 py-20 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <SectionHeader title="¿Que incluye ser miembro SAPIHUM?" text="El valor mensual esta concentrado en comunidad, agenda, sesiones, recursos y prioridad de acceso." />
                    <div className="mt-12 grid gap-4 md:grid-cols-4">
                        {benefits.map(([title, text, Icon]) => (
                            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                                <Icon className="h-6 w-6 text-[#f1b541]" />
                                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                                <p className="mt-3 text-sm leading-6 text-stone-300/70">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative z-10 border-y border-white/10 bg-white/[0.03] px-5 py-20 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <SectionHeader
                        title="Una comunidad con agenda real desde el primer mes"
                        text="En mayo iniciaremos con actividades de formacion, sesiones tematicas, espacios de networking y rutas profesionales en distintas areas de la psicologia."
                    />
                    <div className="mt-12 grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
                        <div className="grid grid-cols-2 gap-3">
                            {areas.map((area) => (
                                <div key={area} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-200">
                                    {area}
                                </div>
                            ))}
                        </div>
                        <div className="rounded-[2rem] border border-white/10 bg-[#15130f] p-6">
                            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f1b541]">Calendario de mayo</p>
                                    <h3 className="mt-2 text-2xl font-semibold">Vista preliminar</h3>
                                </div>
                                <CalendarDays className="h-8 w-8 text-[#f1b541]" />
                            </div>
                            <div className="mt-5 grid gap-3">
                                {['Sesiones tematicas por area', 'Encuentros de networking profesional', 'Actividades con cupo limitado', '2 sesiones premium incluidas para fundadores'].map((item) => (
                                    <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-4">
                                        <Clock className="h-4 w-4 text-[#f1b541]" />
                                        <span className="text-sm text-stone-200">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                <FounderCheckoutButton location="calendar" />
                                <Button type="button" variant="outline" className="rounded-full" onClick={scrollToLeadForm}>
                                    Recibir calendario completo
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative z-10 px-5 py-20 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <SectionHeader title="Beneficios exclusivos para miembros fundadores" text="La urgencia existe porque la condicion fundadora se limita a los primeros 100 miembros o a mayo, lo que ocurra primero." />
                    <div className="mt-12 grid gap-4 md:grid-cols-3">
                        {founderBenefits.map(([title, text]) => (
                            <div key={title} className="rounded-3xl border border-[#f1b541]/20 bg-[#f1b541]/10 p-6">
                                <Check className="h-5 w-5 text-[#f1b541]" />
                                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                                <p className="mt-3 text-sm leading-6 text-stone-300/75">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative z-10 border-y border-white/10 bg-black/25 px-5 py-20 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <SectionHeader title="¿Para quien es SAPIHUM?" text="SAPIHUM esta disenado para profesionales y estudiantes que quieren seguir creciendo dentro del campo de la psicologia y areas afines." />
                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6">
                            <h3 className="text-2xl font-semibold">Es para ti si:</h3>
                            <ul className="mt-6 space-y-3 text-sm leading-6 text-stone-200">
                                {['Eres psicologo o psicologa.', 'Estudias psicologia y quieres ir mas alla de la universidad.', 'Eres psicoterapeuta o profesional de salud mental.', 'Te interesa la formacion continua.', 'Buscas comunidad profesional.', 'Quieres explorar areas como clinica, forense, trauma, duelo, adicciones o intervencion.', 'Quieres conectar con colegas de otros lugares de Mexico.', 'Te interesa participar en una comunidad desde su etapa inicial.'].map((item) => (
                                    <li key={item} className="flex gap-3"><Check className="mt-1 h-4 w-4 text-emerald-300" />{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-[2rem] border border-red-300/20 bg-red-300/10 p-6">
                            <h3 className="text-2xl font-semibold">No es para ti si:</h3>
                            <ul className="mt-6 space-y-3 text-sm leading-6 text-stone-200">
                                {['Solo buscas una clase suelta sin participar en comunidad.', 'No tienes interes en actualizacion profesional.', 'No valoras el networking.', 'Buscas promesas de ingresos rapidos o resultados garantizados.', 'Buscas atencion psicologica como paciente.'].map((item) => (
                                    <li key={item} className="flex gap-3"><X className="mt-1 h-4 w-4 text-red-300" />{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative z-10 px-5 py-20 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <SectionHeader title="¿Como funciona?" />
                    <div className="mt-12 grid gap-4 md:grid-cols-4">
                        {[
                            ['Entras como miembro fundador', 'Te registras con el precio fundador de $250 MXN mensuales.'],
                            ['Recibes acceso a la comunidad', 'Despues de completar tu registro, recibiras indicaciones para acceder a la comunidad y a las actividades disponibles.'],
                            ['Participas en la agenda mensual', 'Podras revisar el calendario, elegir sesiones y participar en actividades seleccionadas.'],
                            ['Accedes a beneficios fundadores', 'Tendras prioridad en cupos limitados, sesiones premium incluidas durante mayo y beneficios preferenciales en formaciones futuras.'],
                        ].map(([title, text], index) => (
                            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                                <span className="text-5xl font-semibold text-[#f1b541]/70">{index + 1}</span>
                                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                                <p className="mt-3 text-sm leading-6 text-stone-300/70">{text}</p>
                            </div>
                        ))}
                    </div>
                    <FounderCheckoutButton location="how_it_works" className="mx-auto mt-10 max-w-sm" />
                </div>
            </section>

            <section className="relative z-10 bg-white px-5 py-20 text-black md:px-8">
                <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-[#f7f1e3] p-6 shadow-2xl md:p-10">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-black/55">Entra como Miembro Fundador SAPIHUM Mexico</p>
                    <h2 className="mt-4 text-4xl font-semibold tracking-tight">Miembro Fundador</h2>
                    <div className="mt-6 flex flex-wrap items-end gap-3">
                        <span className="text-6xl font-semibold tracking-tight">$250</span>
                        <span className="pb-2 text-lg text-black/60">MXN / mes</span>
                    </div>
                    <p className="mt-2 text-sm text-black/55">Precio regular: $290 MXN/mes</p>
                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        {['Comunidad privada.', 'Agenda mensual.', 'Sesiones seleccionadas.', 'Networking profesional.', 'Recursos y materiales.', 'Prioridad en cupos limitados.', '2 sesiones premium incluidas durante mayo.', 'Beneficios preferenciales en formaciones premium.', 'Participacion como primera generacion nacional.'].map((item) => (
                            <div key={item} className="flex gap-3 rounded-2xl bg-black/5 p-3 text-sm">
                                <Check className="h-4 w-4 shrink-0 text-black" />
                                {item}
                            </div>
                        ))}
                    </div>
                    <p className="mt-6 rounded-2xl bg-black p-4 text-sm text-white">
                        Disponible durante mayo o hasta llenar los primeros 100 lugares.
                    </p>
                    <FounderCheckoutButton location="pricing_card" label="Asegurar mi lugar fundador" className="mt-6" />
                    <p className="mt-3 text-center text-xs text-black/55">
                        Membresia mensual. Puedes cancelar cuando quieras. Si cancelas, pierdes el precio fundador.
                    </p>
                </div>
            </section>

            <section id="calendario-mayo" className="relative z-10 px-5 py-20 md:px-8">
                <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr]">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f1b541]">Formulario secundario</p>
                        <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">¿Todavia no estas listo para entrar?</h2>
                        <p className="mt-5 text-lg leading-8 text-stone-300/75">
                            Dejanos tus datos y te enviaremos el calendario de mayo, informacion de las sesiones y detalles del acceso fundador.
                        </p>
                    </div>
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6">
                        <CalendarLeadForm />
                    </div>
                </div>
            </section>

            <section className="relative z-10 border-y border-white/10 bg-black/25 px-5 py-20 md:px-8">
                <div className="mx-auto max-w-4xl">
                    <SectionHeader title="Preguntas frecuentes" />
                    <div className="mt-10 space-y-3">
                        {faqs.map(([question, answer]) => (
                            <details key={question} className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                                    {question}
                                    <ChevronDown className="h-5 w-5 shrink-0 text-[#f1b541] transition group-open:rotate-180" />
                                </summary>
                                <p className="mt-4 text-sm leading-7 text-stone-300/75">{answer}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative z-10 px-5 py-24 text-center md:px-8">
                <div className="mx-auto max-w-4xl">
                    <MessageCircle className="mx-auto h-10 w-10 text-[#f1b541]" />
                    <h2 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
                        Forma parte de la primera generacion nacional de SAPIHUM
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-300/75">
                        SAPIHUM nace para construir una comunidad profesional activa, conectada y en constante formacion. Si eres psicologo, estudiante avanzado o profesional del area y quieres crecer con una red nacional desde el inicio, este es el momento de entrar.
                    </p>
                    <FounderCheckoutButton location="final" className="mx-auto mt-8 max-w-sm" />
                    <p className="mt-4 text-sm text-stone-400">Primeros 100 lugares fundadores disponibles durante mayo.</p>
                </div>
            </section>

            <footer className="relative z-10 border-t border-white/10 px-5 py-8 text-center text-xs text-stone-500 md:px-8">
                <div>SAPIHUM Mexico · Comunidad profesional online · Membresia mensual cancelable</div>
                <Link
                    href="/"
                    className="mt-3 inline-flex text-stone-400 underline-offset-4 transition-colors hover:text-[#f1b541] hover:underline"
                >
                    Conocer SAPIHUM
                </Link>
            </footer>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#090806]/92 p-3 backdrop-blur-xl md:hidden">
                <FounderCheckoutButton location="mobile_sticky" label="Entrar por $250 MXN/mes" />
            </div>
        </main>
    )
}
