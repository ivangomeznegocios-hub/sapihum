import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SPECIALIZATION_CATALOG } from "@/lib/specializations"

export const metadata = {
  title: "SAPIHUM | Psicología Avanzada e Investigación Humana",
  description: "Formación especializada, herramientas clínicas digitales e investigación aplicada para psicólogos que lideran su campo. 12 especialidades, expedientes NOM-004, comunidad científica.",
  openGraph: {
    title: "SAPIHUM | Donde la ciencia del comportamiento se convierte en práctica profesional",
    description: "Plataforma integral para psicólogos: 12 especialidades, herramientas clínicas, formación continua e investigación aplicada.",
    type: "website",
  },
}

const SPECIALTIES = Object.values(SPECIALIZATION_CATALOG).filter(s => s.status === 'active')

const STANDARDS = [
  { name: "NOM-004", desc: "Expediente clínico" },
  { name: "LFPDPPP", desc: "Protección de datos" },
  { name: "APA", desc: "Estándares éticos" },
  { name: "OMS", desc: "Protocolos internacionales" },
  { name: "HIPAA", desc: "Seguridad clínica" },
  { name: "NOM-035", desc: "Salud laboral" },
]

const PLATFORM_FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    title: "Expedientes Clínicos NOM-004",
    description: "Historias clínicas digitales con firma electrónica y trazabilidad completa.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: "Agenda Inteligente",
    description: "Agendamiento online, recordatorios automáticos, lista de espera inteligente.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    title: "Cobros Integrados",
    description: "Stripe, transferencias y efectivo. Facturación automática incluida.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "IA Clínica",
    description: "Transcripción de sesiones, sugerencias de notas y análisis de evolución.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Seguridad y Cumplimiento",
    description: "LFPDPPP, HIPAA, GDPR. Encriptación end-to-end y control de acceso.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    title: "Analíticas de Práctica",
    description: "Métricas de tu consultorio: sesiones, ingresos, retención, inasistencias.",
  },
]

const ACADEMIA_CARDS = [
  {
    icon: "🎓",
    title: "Cursos y Diplomados",
    description: "Programas diseñados por especialistas en ejercicio. Desde fundamentos hasta especializaciones avanzadas.",
    href: "/precios",
    color: "from-teal-500 to-emerald-500",
    borderColor: "border-t-teal-500",
  },
  {
    icon: "📜",
    title: "Certificaciones",
    description: "Acredita tu competencia profesional con certificaciones avaladas por instituciones reconocidas.",
    href: "/precios",
    color: "from-amber-500 to-orange-500",
    borderColor: "border-t-amber-500",
  },
  {
    icon: "🎙",
    title: "Eventos y Webinars",
    description: "Conferencias magistrales, mesas de discusión y networking con referentes de la psicología.",
    href: "/precios",
    color: "from-purple-500 to-violet-500",
    borderColor: "border-t-purple-500",
  },
]

const TESTIMONIALS = [
  {
    quote: "SAPIHUM transformó mi práctica. La supervisión clínica y las herramientas de expediente me ahorraron 10 horas semanales de trabajo administrativo.",
    name: "Mtra. Daniela Herrera",
    role: "Psicóloga Clínica",
    location: "CDMX",
  },
  {
    quote: "Como neuropsicólogo, necesitaba una plataforma que entendiera mis protocolos. SAPIHUM es la primera que lo logra.",
    name: "Dr. Roberto Medina",
    role: "Neuropsicólogo",
    location: "Guadalajara",
  },
  {
    quote: "La sección de investigación es lo que más valoro. Es raro encontrar una comunidad que combine práctica profesional con generación de conocimiento.",
    name: "Dra. Fernanda Ruiz",
    role: "Psicóloga de la Salud",
    location: "Monterrey",
  },
]

const STEPS = [
  {
    step: "01",
    title: "Elige tu especialidad",
    description: "Selecciona tu rama de la psicología y accede a herramientas, formación y comunidad pensadas para tu perfil.",
  },
  {
    step: "02",
    title: "Configura tu práctica",
    description: "Personaliza tu expediente clínico, agenda y métodos de cobro. Todo listo desde el primer día.",
  },
  {
    step: "03",
    title: "Crece con la comunidad",
    description: "Accede a supervisión, eventos, investigación y networking con los mejores profesionales de tu campo.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center flex-1 w-full">

      {/* ══════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-[#0A1628]">
        {/* Neural grid background */}
        <div className="absolute inset-0 -z-0 sapihum-grid-bg" />
        {/* Gradient orbs */}
        <div className="absolute inset-0 -z-0 sapihum-neural-dots" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-teal-500/15 to-emerald-500/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-amber-500/8 blur-[100px]" />
        <div className="absolute left-0 bottom-0 h-[250px] w-[250px] rounded-full bg-purple-500/8 blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-28 md:py-36 lg:py-48">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            {/* Badge */}
            <div className="sapihum-fade-up inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-950/40 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-teal-300 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
              </span>
              🧬 Psicología Avanzada e Investigación Humana
            </div>

            {/* H1 */}
            <h1 className="sapihum-fade-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-white" style={{ animationDelay: '0.1s' }}>
              Donde la ciencia del comportamiento{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300">
                se convierte en práctica profesional.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="sapihum-fade-up mt-7 text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed" style={{ animationDelay: '0.2s' }}>
              Formación especializada, herramientas clínicas digitales e investigación aplicada para psicólogos que lideran su campo.
            </p>

            {/* CTA Buttons */}
            <div className="sapihum-fade-up mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto" style={{ animationDelay: '0.3s' }}>
              <Link href="/especialidades" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-base h-13 px-8 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all border-0 font-semibold sapihum-glow-cta">
                  Explorar Especialidades
                </Button>
              </Link>
              <Link href="/precios" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-base h-13 px-8 border-slate-500 text-slate-200 hover:bg-white/5 hover:text-white hover:border-teal-400/50 transition-all">
                  Conocer la Academia →
                </Button>
              </Link>
            </div>

            {/* Trust pills */}
            <div className="sapihum-fade-up mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400" style={{ animationDelay: '0.4s' }}>
              {["12 Especialidades", "Expedientes NOM-004", "Investigación activa", "+500 profesionales"].map((pill) => (
                <span key={pill} className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/40 px-3 py-1">
                  <span className="h-1 w-1 rounded-full bg-teal-400"></span>
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — STANDARDS BAR
      ══════════════════════════════════════════════════ */}
      <section className="w-full border-y bg-muted/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-5">
            Alineados con estándares internacionales
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {STANDARDS.map((std) => (
              <div key={std.name} className="text-center group cursor-default">
                <div className="text-sm font-bold text-foreground/70 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {std.name}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{std.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 3 — WHAT IS SAPIHUM
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text column */}
            <div>
              <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-3">
                Sobre SAPIHUM
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                No somos un software genérico.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
                  Somos un ecosistema de desarrollo profesional.
                </span>
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
                SAPIHUM nace de una premisa: la psicología profesional merece infraestructura de primer nivel. Combinamos formación especializada, herramientas clínicas con estándares NOM-004, y una comunidad de investigación activa — todo en una sola plataforma construida por y para psicólogos.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "12", label: "Especialidades activas" },
                { value: "500+", label: "Profesionales activos" },
                { value: "98%", label: "Satisfacción reportada" },
                { value: "6", label: "Líneas de investigación" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border bg-card p-6 text-center sapihum-card-glow">
                  <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 4 — SPECIALTIES GRID (12)
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28 bg-muted/30 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-3">
              Especialidades
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              12 ramas de la psicología.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
                Una plataforma para dominarlas todas.
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Cada especialidad incluye formación, herramientas y una comunidad de profesionales enfocados en tu misma área.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sapihum-stagger">
            {SPECIALTIES.map((spec) => (
              <Link
                key={spec.code}
                href={`/especialidades/${spec.slug}`}
                className="group relative rounded-2xl border bg-card p-6 sapihum-card-glow overflow-hidden"
              >
                {/* Left accent bar on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl" />

                <div className="text-3xl mb-4 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 w-14 h-14 rounded-xl flex items-center justify-center">
                  {spec.icon}
                </div>
                <h3 className="text-base font-bold mb-1.5 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {spec.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {spec.tagline}
                </p>
                <div className="text-sm font-semibold text-teal-600 dark:text-teal-400 flex items-center">
                  Explorar <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/especialidades">
              <Button variant="outline" className="border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-teal-700 dark:text-teal-300">
                Ver todas las especialidades →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 5 — PLATFORM / FEATURES
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full py-20 md:py-28 bg-[#0A1628] text-white overflow-hidden">
        <div className="absolute inset-0 sapihum-grid-bg opacity-40" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-teal-500/8 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">
              Plataforma
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Herramientas clínicas que{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                trabajan por ti.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6 hover:border-teal-500/40 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 6 — ACADEMIA
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-3">
              Academia SAPIHUM
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Formación continua con{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
                respaldo científico.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ACADEMIA_CARDS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className={`group rounded-2xl border bg-card p-8 border-t-4 ${card.borderColor} sapihum-card-glow`}
              >
                <div className="text-4xl mb-5">{card.icon}</div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-5">
                  {card.description}
                </p>
                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 flex items-center">
                  Ver más <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 7 — RESEARCH / INVESTIGACIÓN
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full py-20 md:py-28 bg-gradient-to-br from-[#0A1628] via-[#0d2137] to-[#0A1628] text-white overflow-hidden border-y">
        <div className="absolute inset-0 sapihum-grid-bg opacity-30" />
        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-teal-500/8 blur-[150px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">
                Investigación
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                No solo enseñamos psicología.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-amber-400">
                  La generamos.
                </span>
              </h2>
              <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
                SAPIHUM mantiene líneas de investigación activas en colaboración con instituciones académicas. Nuestros hallazgos alimentan directamente los cursos, protocolos y herramientas que ofrecemos a nuestros miembros.
              </p>
              <div className="mt-8">
                <Link href="/nosotros">
                  <Button variant="outline" className="border-teal-400/50 text-teal-300 hover:bg-teal-500/10 hover:text-white">
                    Conocer nuestras líneas de investigación →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Research stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "6", label: "Líneas de investigación activas" },
                { value: "15+", label: "Publicaciones en proceso" },
                { value: "3", label: "Alianzas institucionales" },
              ].map((stat) => (
                <div key={stat.label} className="text-center rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                  <div className="text-3xl md:text-4xl font-bold text-teal-400">{stat.value}</div>
                  <div className="mt-2 text-xs text-slate-400 leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 8 — TESTIMONIALS
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Lo que dicen quienes ya{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
                forman parte
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="relative rounded-2xl border bg-card p-8 sapihum-card-glow">
                {/* Decorative quote mark */}
                <div className="absolute top-4 right-6 text-6xl font-serif text-teal-500/10 leading-none select-none">"</div>

                <blockquote className="text-muted-foreground leading-relaxed mb-6 relative z-10">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.split(' ').slice(-1)[0][0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-teal-600 dark:text-teal-400">
                      {t.role}, {t.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 9 — HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28 bg-muted/30 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-3">
              Cómo funciona
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Comienza en menos de 5 minutos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((item, i) => (
              <div key={item.step} className="text-center relative">
                {/* Connector line (desktop only) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-[2px] bg-gradient-to-r from-teal-500/40 to-teal-500/10" />
                )}

                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white font-bold text-lg shadow-lg shadow-teal-500/25">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 10 — PRICING PREVIEW
          (Uses existing pricing data — links to /precios)
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full py-20 md:py-28 bg-[#0A1628] text-white overflow-hidden">
        <div className="absolute inset-0 sapihum-grid-bg opacity-30" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">
              Planes
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Invierte en tu{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-amber-400">
                crecimiento profesional
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Diferentes niveles para diferentes etapas de tu carrera profesional.
            </p>
          </div>

          <div className="flex justify-center">
            <Link href="/precios">
              <Button size="lg" className="text-base h-13 px-10 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all border-0 font-semibold">
                Ver Planes y Precios →
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Sin compromisos · Cancela cuando quieras · Facturación mensual o anual
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 11 — FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#0A1628] via-teal-900 to-[#0A1628] px-6 py-16 md:px-16 md:py-20 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-teal-500/10 -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-amber-500/10 translate-x-1/3 translate-y-1/3 blur-3xl" />
            <div className="absolute inset-0 sapihum-grid-bg opacity-20 rounded-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                La psicología profesional merece{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-amber-400">
                  infraestructura de primer nivel.
                </span>
              </h2>
              <p className="mt-5 text-lg text-slate-300 max-w-xl mx-auto">
                Únete a la comunidad de profesionales que están transformando su práctica con ciencia, tecnología y comunidad.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="text-base h-13 px-8 bg-white text-[#0A1628] hover:bg-teal-50 shadow-lg font-semibold">
                    Comenzar Ahora
                  </Button>
                </Link>
                <Link href="/nosotros">
                  <Button size="lg" variant="outline" className="text-base h-13 px-8 border-slate-400 text-slate-200 hover:bg-white/10 hover:text-white">
                    Conocer SAPIHUM
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
