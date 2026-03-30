import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SPECIALIZATION_CATALOG } from "@/lib/specializations"
import { getUnifiedCatalogEvents } from "@/lib/supabase/queries/events"
import { getPublicEventPath } from "@/lib/events/public"
import { CheckCircle2, ChevronDown, Shield, Users, BookOpen, Scaling, Beaker, FileText, Smartphone, CalendarDays, ArrowRight } from "lucide-react"

export const metadata = {
  title: "SAPIHUM | Comunidad Profesional de Psicología Avanzada",
  description: "La comunidad profesional para psicólogos que quieren elevar su nivel. Especializaciones, formación continua, investigación y herramientas clínicas integradas.",
  openGraph: {
    title: "SAPIHUM | Comunidad Profesional de Psicología Avanzada",
    description: "SAPIHUM reúne especializaciones, formación continua, investigación aplicada, herramientas profesionales y una red de colegas con visión de crecimiento.",
    type: "website",
  },
}

const SPECIALTIES = Object.values(SPECIALIZATION_CATALOG).filter(s => s.status === 'active')

const CREDIBILITY_PILLS = [
  "Especializaciones por área",
  "Formación continua",
  "Comunidad profesional",
  "Investigación aplicada",
  "Recursos y herramientas"
]

const WHAT_YOU_GET = [
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Actualización constante",
    description: "Conocimiento vigente y respaldado científicamente para tomar mejores decisiones."
  },
  {
    icon: <Scaling className="w-6 h-6" />,
    title: "Especialización con criterio",
    description: "12 ramas de la psicología estructuradas para llevarte al nivel experto."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Comunidad activa",
    description: "Intercambio, supervisión y apoyo entre colegas de alto nivel."
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Herramientas integradas",
    description: "Expediente NOM-004, agenda e IA clínica para simplificar tu trabajo administrativo."
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Estructura profesional",
    description: "Práctica sólida, organizada y segura basada en estándares internacionales."
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Visibilidad y posicionamiento",
    description: "Destaca en tu perfil público como un profesional certificado en la red SAPIHUM."
  }
]

const PLATFORM_FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    title: "Expedientes Clínicos NOM-004",
    description: "Historias clínicas digitales con firma electrónica y trazabilidad completa.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
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
    title: "Cobros e Integraciones",
    description: "Stripe, transferencias y efectivo. Facturación automática incluida.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "IA Clínica Segura",
    description: "Transcripción de sesiones, sugerencias de notas y análisis de evolución.",
  },
]

const TESTIMONIALS = [
  {
    quote: "SAPIHUM transformó mi práctica. Es increíble encontrar una comunidad en la que se respira tanto nivel profesional, estructura y respaldo, sin perder de vista las herramientas que me ahorran tiempo.",
    name: "Mtra. Daniela Herrera",
    role: "Psicóloga Clínica",
    location: "CDMX",
  },
  {
    quote: "Como neuropsicólogo, necesitaba pertenecer a una red que entendiera mis protocolos. SAPIHUM eleva el estándar de lo que debe ser la psicología moderna y eso se nota inmediatamente en la calidad de su ecosistema.",
    name: "Dr. Roberto Medina",
    role: "Neuropsicólogo",
    location: "Guadalajara",
  },
  {
    quote: "La sección de investigación es lo que más valoro. Es raro encontrar una comunidad profesional que combine la práctica del día a día con generación real de conocimiento avanzado.",
    name: "Dra. Fernanda Ruiz",
    role: "Psicóloga de la Salud",
    location: "Monterrey",
  },
]

const FAQS = [
  {
    q: "¿Qué es SAPIHUM?",
    a: "SAPIHUM es el ecosistema y la comunidad profesional para psicólogos que buscan crecer. Integramos especializaciones por rama, formación continua avalada, investigación aplicada y tecnología clínica de primer nivel en una sola plataforma."
  },
  {
    q: "¿SAPIHUM es una comunidad exclusivamente para psicólogos?",
    a: "Sí. Todo nuestro entorno, desde las líneas de investigación hasta las herramientas de agenda y expediente clínico (NOM-004), está diseñado por y para profesionales de la psicología que desean un ejercicio serio y especializado."
  },
  {
    q: "¿Qué especialidades incluye?",
    a: "SAPIHUM abarca 12 ramas principales de especialización en psicología, incluyendo Psicología Clínica, Neuropsicología, Psicología Organizacional, Psicología Infantil y del Adolescente, Forense, del Deporte, y más."
  },
  {
    q: "¿SAPIHUM incluye herramientas para la práctica profesional?",
    a: "Así es. Al ser miembro de SAPIHUM, además de pertenecer a la comunidad, tienes acceso a infraestructura profesional integral: sistema de expedientes encriptados y alineados a normativas, software de agendamiento, cobros automatizados e IA clínica."
  },
  {
    q: "¿SAPIHUM ofrece formación continua?",
    a: "Sí. A través de nuestra división académica, los miembros acceden a un catálogo en constante expansión de certificaciones, diplomados, cursos y mesas de discusión desarrollados por expertos en ejercicio activo."
  },
  {
    q: "¿Quién puede unirse a SAPIHUM?",
    a: "Estudiantes de últimos semestres, pasantes, licenciados y posgraduados en psicología que tengan el compromiso de elevar el valor y el prestigio de su ejercicio profesional."
  }
]

export default async function LandingPage() {
  const upcomingEvents = (await getUnifiedCatalogEvents()).filter((e: any) => e.status === 'upcoming' || e.status === 'live').slice(0, 3)

  return (
    <div className="flex flex-col items-center flex-1 w-full">

      {/* ══════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-white dark:bg-black">
        {/* Neural grid background */}
        <div className="absolute inset-0 -z-0 sapihum-grid-bg" />
        <div className="absolute inset-0 -z-0 sapihum-neural-dots" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#f6ae02]/15 to-[#7a5602]/10 blur-[120px]" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-28 md:py-36 lg:py-48">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            {/* Badge */}
            <div className="sapihum-fade-up inline-flex items-center gap-2 rounded-lg border border-[#f6ae02]/30 bg-[#f6ae02]/5 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-[#f6ae02] uppercase tracking-[1px] mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f6ae02] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f6ae02]"></span>
              </span>
              Sistemas Avanzados de Psicología e Investigación Humana
            </div>

            {/* H1 */}
            <h1 className="sapihum-fade-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-black dark:text-white" style={{ animationDelay: '0.1s' }}>
              La comunidad profesional para psicólogos que quieren{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">elevar su nivel.</span>
                <svg className="absolute -bottom-2 w-full h-3 text-[#f6ae02]" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="transparent"/>
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="sapihum-fade-up mt-7 text-lg md:text-xl text-[#2c2c2b]/80 dark:text-[#c0bfbc] max-w-3xl leading-relaxed" style={{ animationDelay: '0.2s' }}>
              Especializaciones, formación continua, investigación aplicada, herramientas profesionales y una red de colegas que entienden hacia dónde debe evolucionar la psicología.
            </p>

            {/* CTA Buttons */}
            <div className="sapihum-fade-up mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto" style={{ animationDelay: '0.3s' }}>
              <Link href="/especialidades" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-base h-13 px-8 bg-[#f6ae02] hover:bg-[#7a5602] text-black hover:text-white shadow-lg shadow-[#f6ae02]/25 hover:shadow-xl hover:shadow-[#f6ae02]/30 transition-all border-0 font-semibold sapihum-glow-cta">
                  Explorar Especialidades
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/nosotros" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-base h-13 px-8 border-[#c0bfbc] dark:border-[#2c2c2b] text-[#2c2c2b] dark:text-[#c0bfbc] hover:bg-[#c0bfbc]/10 dark:hover:bg-white/5 hover:text-black dark:hover:text-white hover:border-[#2c2c2b] dark:hover:border-[#c0bfbc] transition-all font-semibold">
                  Conocer SAPIHUM →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          2. BLOQUE DE CREDIBILIDAD
      ══════════════════════════════════════════════════ */}
      <section className="w-full border-y bg-muted/40 dark:bg-[#0a0a0a] backdrop-blur-sm relative z-20 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {CREDIBILITY_PILLS.map((pill) => (
              <div key={pill} className="flex items-center text-sm font-semibold text-foreground/80">
                <CheckCircle2 className="w-4 h-4 mr-2 text-[#f6ae02]" />
                {pill}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. QUÉ ES SAPIHUM
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <p className="text-sm font-bold text-[#f6ae02] uppercase tracking-[1px] mb-3">
              Ecosistema
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-black dark:text-white">
              Qué es SAPIHUM
            </h2>
            <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
              SAPIHUM es un ecosistema profesional en línea para psicólogos que buscan crecer con <strong className="text-foreground">mayor profundidad, estructura y respaldo</strong>. Integramos todas las piezas del rompecabezas profesional en un solo lugar.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. POR QUÉ PERTENECER (Aspiracional)
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28 bg-muted/40 dark:bg-[#0a0a0a] border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Contexto y Pertenencia */}
            <div>
              <p className="text-sm font-bold text-[#f6ae02] uppercase tracking-[1px] mb-3">
                Identidad y Pertenencia
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-black dark:text-white">
                El profesional que entra a SAPIHUM no busca solo cursos.
              </h2>
              <ul className="space-y-6">
                {[
                  "Busca diferenciarse del promedio y elevar su estándar.",
                  "Busca especializarse con criterio y sustento científico.",
                  "Busca mantenerse vigente con las mejores prácticas.",
                  "Busca pertenecer a una red seria, exigente y colaborativa.",
                  "Busca acceder a herramientas y conocimiento que normalmente están fragmentados."
                ].map((item, idx) => (
                  <li key={idx} className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f6ae02]/10 text-[#f6ae02]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="ml-3 text-lg text-muted-foreground">{item}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tarjeta Por qué Pertenecer */}
            <div className="rounded-2xl border bg-card p-8 md:p-12 sapihum-card-glow shadow-xl sm:mx-6 lg:mx-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f6ae02]/10 rounded-bl-full blur-[40px]" />
              <h3 className="text-2xl font-bold mb-6 text-foreground">¿Por qué pertenecer a SAPIHUM?</h3>
              <div className="space-y-5">
                {[
                  "Porque el conocimiento aislado ya no alcanza para destacar.",
                  "Porque especializarte aumenta automáticamente tu valor profesional.",
                  "Porque necesitas una comunidad activa, no solo contenido estático.",
                  "Porque tu práctica merece estructura y actualización constante.",
                  "Porque el futuro del psicólogo profesional exige más nivel, no más improvisación."
                ].map((reason, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="text-[#f6ae02] font-black">—</span>
                    <span className="text-foreground/80 font-medium">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. ESPECIALIDADES (SEO-friendly grid)
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-black dark:text-white">
              Explora nuestras áreas de <span className="text-[#f6ae02]">especialización en psicología</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Cada especialidad dentro de SAPIHUM integra formación, actualización, recursos y comunidad para fortalecer tu ejercicio profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sapihum-stagger">
            {SPECIALTIES.map((spec) => (
              <Link
                key={spec.code}
                href={`/especialidades/${spec.slug}`}
                className="group relative rounded-lg border bg-card p-6 sapihum-card-glow overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#f6ae02] to-[#7a5602] opacity-0 group-hover:opacity-100 transition-opacity rounded-l-lg" />
                <div className="text-3xl mb-4 bg-[#f6ae02]/5 dark:bg-[#f6ae02]/10 w-14 h-14 rounded-lg flex items-center justify-center">
                  {spec.icon}
                </div>
                <h3 className="text-base font-bold mb-1.5 group-hover:text-[#f6ae02] transition-colors">
                  {spec.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {spec.tagline}
                </p>
                <div className="text-sm font-bold text-[#f6ae02] flex items-center">
                  Ver especialidad <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. QUÉ OBTIENES DENTRO
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 sapihum-grid-bg opacity-40 mix-blend-overlay" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-[#f6ae02]/10 blur-[120px]" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Qué obtienes dentro de tu membresía
            </h2>
            <p className="text-[#c0bfbc] text-lg">Más allá de la teoría, construimos el entorno completo.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {WHAT_YOU_GET.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 mt-1 h-12 w-12 rounded-lg flex items-center justify-center bg-[#f6ae02]/10 text-[#f6ae02] border border-[#f6ae02]/20">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-white">{item.title}</h3>
                  <p className="text-[#c0bfbc] text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. INVESTIGACIÓN APLICADA
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full py-24 border-b bg-background overflow-hidden">
        <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#f6ae02]/10 rounded-full blur-[100px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <p className="text-sm font-bold text-[#f6ae02] uppercase tracking-[1px] mb-3">
                Diferenciador Institucional
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6 text-black dark:text-white">
                Investigación aplicada para una <span className="text-[#f6ae02]">práctica más sólida.</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl border-l-4 border-[#f6ae02] pl-6 my-8">
                En SAPIHUM impulsamos una visión donde la formación, la práctica profesional y la investigación se conectan para generar más criterio, mejores decisiones y mayor profundidad clínica y profesional.
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <div className="bg-card w-full border rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-lg">
                <Beaker className="w-16 h-16 text-[#f6ae02] mb-6" />
                <h3 className="font-bold text-xl mb-4 text-foreground">Líneas de investigación activas</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Nuestros hallazgos alimentan directamente los protocolos, herramientas y cursos ofrecidos en el ecosistema.
                </p>
                <Link href="/nosotros" className="text-sm font-bold text-[#f6ae02] hover:text-[#7a5602] transition-colors">
                  Explorar ciencia SAPIHUM →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          8. RECURSOS Y HERRAMIENTAS (Software)
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28 bg-muted/30 dark:bg-[#0a0a0a] border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-bold text-[#f6ae02] uppercase tracking-[1px] mb-3">
              Herramientas de Plataforma
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
              Infraestructura digital que acelera tu trabajo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-lg border bg-card p-6 hover:border-[#f6ae02]/40 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f6ae02]/5 dark:bg-[#f6ae02]/10 text-[#f6ae02] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          8.5. PRÓXIMOS EVENTOS
      ══════════════════════════════════════════════════ */}
      {upcomingEvents.length > 0 && (
        <section className="w-full py-20 md:py-28 bg-background border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
              <div>
                <p className="text-sm font-bold text-[#f6ae02] uppercase tracking-[1px] mb-3">
                  Academia SAPIHUM
                </p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
                  Próximos en la Academia
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Formaciones, eventos en vivo, cursos y experiencias para la comunidad.
                </p>
              </div>
              <Link href="/academia" className="shrink-0">
                <Button variant="outline" className="gap-2 font-semibold hover:border-[#f6ae02]/50 hover:text-[#f6ae02]">
                  Ver catálogo completo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event: any) => {
                const publicPath = getPublicEventPath(event)
                const price = Number(event.price || 0)
                const dateStr = new Date(event.start_time).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                const timeStr = new Date(event.start_time).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
                const speakerName = event.speakers?.[0]?.speaker?.profile?.full_name
                const typeLabels: Record<string, { label: string; color: string }> = {
                  live: { label: 'En Vivo', color: 'bg-[#f6ae02]' },
                  course: { label: 'Formación', color: 'bg-[#7a5602]' },
                  presencial: { label: 'Presencial', color: 'bg-[#2c2c2b]' },
                }
                const typeBadge = typeLabels[event.event_type] || { label: 'Evento', color: 'bg-[#f6ae02]' }

                return (
                  <Link
                    key={event.id}
                    href={publicPath}
                    className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#f6ae02]/30"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-black via-[#2c2c2b] to-[#7a5602]/40">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CalendarDays className="h-12 w-12 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <span className={`absolute top-3 left-3 inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wide ${typeBadge.color}`}>
                        {typeBadge.label}
                      </span>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-white/95 dark:bg-black/90 px-2.5 py-1.5 shadow-sm">
                        <CalendarDays className="h-3.5 w-3.5 text-[#f6ae02]" />
                        <span className="text-xs font-semibold text-black dark:text-white">{dateStr}</span>
                        <span className="text-[10px] text-[#2c2c2b] dark:text-[#c0bfbc]">{timeStr}</span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      {speakerName && (
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{speakerName}</p>
                      )}
                      <h3 className="line-clamp-2 text-lg font-semibold leading-snug group-hover:text-[#f6ae02] transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex-1" />
                      <div className="mt-4 flex items-center justify-between border-t pt-3">
                        {price > 0 ? (
                          <span className="text-base font-bold">${price.toFixed(0)} MXN</span>
                        ) : (
                          <span className="text-sm font-bold text-[#f6ae02]">Gratis</span>
                        )}
                        <span className="text-xs font-bold text-[#f6ae02] group-hover:underline">Ver detalles →</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          9. TESTIMONIOS / RESPALDO
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
              El respaldo de la{" "}
              <span className="text-[#f6ae02]">
                red SAPIHUM
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="relative rounded-lg border bg-muted/20 dark:bg-[#0a0a0a] p-8">
                <blockquote className="text-muted-foreground text-sm leading-relaxed mb-6">
                  &quot;{t.quote}&quot;
                </blockquote>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-lg bg-[#f6ae02] flex items-center justify-center text-black font-bold text-sm shrink-0">
                    {t.name.split(' ').slice(-1)[0][0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{t.name}</div>
                    <div className="text-xs text-[#f6ae02]">
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          10. FAQ SEO
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-28 bg-muted/30 dark:bg-[#0a0a0a] border-y">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">Preguntas Frecuentes</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <details key={idx} className="group rounded-lg border bg-card px-6 py-4 [&_summary::-webkit-details-marker]:hidden cursor-pointer shadow-sm">
                <summary className="flex items-center justify-between font-bold text-lg outline-none">
                  {faq.q}
                  <span className="ml-4 transition-transform duration-300 group-open:rotate-180">
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </span>
                </summary>
                <div className="pt-4 text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          11. FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-20 md:py-32 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-white dark:bg-white text-black px-6 py-16 md:px-16 md:py-20 text-center overflow-hidden border border-[#c0bfbc] shadow-2xl">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-[#f6ae02]/20 -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#f6ae02]/15 translate-x-1/3 translate-y-1/3 blur-3xl" />

            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black tracking-tight leading-tight">
                No se trata solo de estudiar más. <br />
                <span className="text-[#f6ae02] mt-2 block">
                  Se trata de convertirte en un profesional con más nivel, más criterio y más valor.
                </span>
              </h2>
              
              <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center">
                <Link href="/precios" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-base h-14 px-10 bg-[#f6ae02] text-black hover:bg-[#7a5602] hover:text-white hover:scale-105 shadow-xl transition-all font-bold">
                    Unirme a SAPIHUM
                  </Button>
                </Link>
                <Link href="/nosotros" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full text-base h-14 px-10 border-2 border-black text-black hover:bg-black hover:text-[#f6ae02] transition-colors font-bold">
                    Conocer la comunidad
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
