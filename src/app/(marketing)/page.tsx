import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Comunidad de Psicologia | La plataforma todo-en-uno para psicologos",
  description: "Expedientes clinicos, agenda automatizada, pagos, comunidad exclusiva y herramientas de crecimiento profesional alineadas con controles de privacidad y seguridad. Disenada por y para psicologos.",
  openGraph: {
    title: "Comunidad de Psicologia | Gestiona tu practica, eleva tus pacientes",
    description: "La plataforma todo-en-uno para psicologos. Expedientes, agenda, pagos y comunidad.",
    type: "website",
  },
}

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    title: "Expedientes Clinicos",
    description: "Historias clinicas digitales alineadas con controles de privacidad, seguridad y manejo de informacion sensible. Organizadas y accesibles desde cualquier dispositivo.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: "Agenda Inteligente",
    description: "Tus pacientes agendan en linea, reciben recordatorios automaticos y tu reduces las inasistencias hasta un 40%.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    title: "Pagos Integrados",
    description: "Cobra por sesion o por membresia. Stripe, transferencia o efectivo. Facturacion automatica incluida.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Comunidad Exclusiva",
    description: "Conecta con cientos de psicologos. Eventos en vivo, diplomados, networking y oportunidades de colaboracion.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Cumplimiento Legal",
    description: "Controles y flujos alineados con NOM-004, LFPDPPP, HIPAA y GDPR para apoyar la operacion responsable de tu consulta.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    title: "Crecimiento Profesional",
    description: "Herramientas de marketing, referidos y analiticas para que tu consulta crezca de forma sostenible.",
  },
]

const STATS = [
  { value: "500+", label: "Psicologos activos" },
  { value: "98%", label: "Satisfaccion" },
  { value: "40%", label: "Menos inasistencias" },
  { value: "NOM-004", label: "Controles alineados" },
]

const ESPECIALIDADES = [
  {
    title: "Psicologia Clinica",
    desc: "Disponible ahora con precio y beneficios definidos.",
    href: "/especialidades/psicologia-clinica",
    icon: "Clinica"
  },
  {
    title: "Psicologia Forense (Proximamente)",
    desc: "En lista de espera. Se abrira segun demanda de la comunidad.",
    href: "/precios",
    icon: "Forense"
  },
  {
    title: "Psicologia Infantil (Proximamente)",
    desc: "En lista de espera. Se abrira segun demanda de la comunidad.",
    href: "/precios",
    icon: "Infantil"
  },
  {
    title: "Adulto Mayor (Proximamente)",
    desc: "En lista de espera. Se abrira segun demanda de la comunidad.",
    href: "/precios",
    icon: "Adulto"
  }
]

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center flex-1 w-full">

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
          <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-[120px]" />
          <div className="absolute right-0 top-1/3 -z-10 h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-44">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 mb-8 animate-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              Plataforma en crecimiento - Unite hoy
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Gestiona tu practica,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                eleva tus pacientes.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Expedientes clinicos, agenda automatizada, pagos integrados y una comunidad exclusiva para tu crecimiento profesional, con controles orientados a privacidad y seguridad. Todo en un solo lugar.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-base h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
                  Comenzar Gratis
                </Button>
              </Link>
              <Link href="/precios" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-base h-12 px-8">
                  Ver Planes y Precios
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <p className="mt-6 text-xs text-muted-foreground">
              Sin tarjeta de credito · Configuracion en 2 minutos · Cancela cuando quieras
            </p>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="w-full border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESPECIALIDADES SECTION (NEW) */}
      <section className="w-full py-20 md:py-28 bg-muted/30 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Disenado para <span className="text-blue-600 dark:text-blue-400">tu especialidad</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No somos un software generico. Descubre las herramientas especificas que hemos construido para tu perfil clinico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ESPECIALIDADES.map((esp) => (
              <Link key={esp.title} href={esp.href} className="group relative rounded-2xl border bg-card p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:-translate-y-1">
                <div className="text-4xl mb-4 bg-blue-50 dark:bg-blue-900/30 w-16 h-16 rounded-2xl flex items-center justify-center">
                  {esp.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{esp.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{esp.desc}</p>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                  Ver mas detalles <span className="ml-1 transition-transform group-hover:translate-x-1">-&gt;</span>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/especialidades">
              <Button variant="outline" className="border-blue-200 dark:border-blue-800">Ver todas las especialidades</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="caracteristicas" className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
              Caracteristicas
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Todo lo que necesitas para tu consulta
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Desde la primera cita hasta el crecimiento de tu marca personal, tenemos cada aspecto cubierto.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border bg-card p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-600 dark:text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full py-20 md:py-28 bg-muted/30 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
              Como funciona
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Empieza en menos de 5 minutos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[{
              step: "01",
              title: "Crea tu cuenta",
              description: "Registrate con tu email o Google. Sin tarjeta de credito necesaria.",
            },
            {
              step: "02",
              title: "Configura tu perfil",
              description: "Agrega tu especialidad, horarios y metodo de pago preferido.",
            },
            {
              step: "03",
              title: "Comienza a crecer",
              description: "Gestiona pacientes, agenda citas y accede a la comunidad desde el Dia 1.",
            }].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-blue-500/25">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-16 md:px-16 md:py-20 text-center overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-white/10 -translate-x-1/2 -translate-y-1/2 blur-2xl" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-white/10 translate-x-1/3 translate-y-1/3 blur-2xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Listo para transformar tu practica?
              </h2>
              <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">
                Unete a la comunidad de psicologos que ya estan creciendo profesionalmente con nuestra plataforma.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="text-base h-12 px-8 bg-white text-blue-700 hover:bg-blue-50 shadow-lg font-semibold">
                    Comenzar Gratis
                  </Button>
                </Link>
                <Link href="/precios">
                  <Button size="lg" variant="outline" className="text-base h-12 px-8 border-white text-white hover:bg-white/10 hover:text-white">
                    Ver Planes y Precios
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
