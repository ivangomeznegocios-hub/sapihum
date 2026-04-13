import Link from "next/link"
import Image from "next/image"
import { BrandWordmark } from "@/components/brand/brand-wordmark"
import { Button } from "@/components/ui/button"
import { splitPublicCatalogEvents } from "@/lib/events/public"
import { getMarketingSpecializations, getSpecializationByCode } from "@/lib/specializations"
import { getUnifiedCatalogEvents } from "@/lib/supabase/queries/events"
import { getPublicEventPath } from "@/lib/events/public"
import { getPublicFormations } from "@/app/(marketing)/formaciones/actions"
import { LEVEL_2_CARD_FEATURE_IDS, PRICING_PLAN_COPY, getPricingFeatureTitles } from "@/lib/pricing-catalog"
import { getFeaturedPublicSpeakers } from "@/lib/supabase/queries/speakers"
import { Shield, Users, BookOpen, Scaling, Beaker, FileText, Smartphone, CalendarDays, ArrowRight } from "lucide-react"

export const metadata = {
  title: "SAPIHUM | Comunidad Profesional de Psicología Avanzada",
  description: "Cursos y formaciones especializadas para psicólogos que buscan crecer con más estructura, criterio y respaldo profesional.",
  openGraph: {
    title: "SAPIHUM | Comunidad Profesional de Psicología Avanzada",
    description: "Academia SAPIHUM: cursos, formaciones, membresía profesional y herramientas para fortalecer la práctica psicológica.",
    type: "website",
  },
}

const SPECIALTIES = getMarketingSpecializations()

type SpecialtyBackground = {
  image: string
  position?: string
}

const PLATFORM_SECTION_BACKGROUND: SpecialtyBackground = {
  image: "https://images.unsplash.com/photo-1758273241086-f3585ef8c2f8?auto=format&fit=crop&w=2400&q=80",
  position: "center 34%",
}

const SPECIALTY_BACKGROUNDS: Record<string, SpecialtyBackground> = {
  clinica: {
    image: "https://unsplash.com/photos/K_MSe-zglGI/download?force=true&w=1400&q=80",
    position: "center",
  },
  neuropsicologia: {
    image: "https://unsplash.com/photos/AB0r9z7eRYg/download?force=true&w=1400&q=80",
    position: "center",
  },
  forense: {
    image: "https://unsplash.com/photos/KJgkqQcdynQ/download?force=true&w=1400&q=80",
    position: "center",
  },
  organizacional: {
    image: "https://unsplash.com/photos/VBLHICVh-lI/download?force=true&w=1400&q=80",
    position: "center",
  },
  educacion: {
    image: "https://unsplash.com/photos/M92wusZZ_qg/download?force=true&w=1400&q=80",
    position: "center",
  },
  psicogerontologia: {
    image: "https://unsplash.com/photos/bSXk1lOp8T0/download?force=true&w=1400&q=80",
    position: "center",
  },
  deportiva: {
    image: "https://unsplash.com/photos/9orpQvNujSM/download?force=true&w=1400&q=80",
    position: "center",
  },
  sexologia_clinica: {
    image: "https://unsplash.com/photos/UB58ZfXeI1k/download?force=true&w=1400&q=80",
    position: "center",
  },
}

const CREDIBILITY_PILLS = [
  "Academia especializada",
  "Cursos y formaciones",
  "Membresía profesional",
  "Investigación aplicada",
  "Herramientas clínicas"
]

const WHAT_YOU_GET = [
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Acceso continuo a contenidos y recursos",
    description: "Mantente cerca de nuevos materiales, sesiones y recursos que complementan tu formación."
  },
  {
    icon: <Scaling className="w-6 h-6" />,
    title: "Comunidad profesional especializada",
    description: "Comparte espacio con colegas que también buscan crecer con más estructura y criterio."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Mayor cercanía con el ecosistema SAPIHUM",
    description: "Tu experiencia se vuelve más continua al conectar academia, recursos y comunidad en un solo lugar."
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Herramientas complementarias para tu práctica",
    description: "Accede a funcionalidades que te ayudan a trabajar con mejor orden y soporte operativo."
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Entorno de actualización constante",
    description: "Sigue en contacto con experiencias de aprendizaje y mejora profesional de forma sostenida."
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Beneficios adicionales para miembros",
    description: "La membresía funciona como una extensión natural para quienes quieren una experiencia más amplia."
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
    description: "Historias clínicas digitales con mejor orden, trazabilidad, respaldo documental y alineación con NOM-004 y marcos complementarios de resguardo.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
      </svg>
    ),
    title: "Agenda Inteligente",
    description: "Agendamiento, recordatorios y mejor organización del seguimiento profesional.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    title: "Cobros e Integraciones",
    description: "Opciones para facilitar cobros, seguimiento y administración operativa.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "IA Clínica Segura",
    description: "Apoyo para documentación, notas y procesos clínicos con mayor eficiencia.",
  },
]

const CLINICAL_LEVEL2_BENEFITS = getPricingFeatureTitles(LEVEL_2_CARD_FEATURE_IDS)
const LEVEL_2_SHOWCASE_BENEFITS = CLINICAL_LEVEL2_BENEFITS
  .filter((benefit) => benefit !== "Todo de Comunidad y Crecimiento")
  .slice(0, 8)

// ═══════════════════════════════════════════════════════════════
// FEATURED SPEAKERS — Change these IDs to control which 4 speakers
// appear on the homepage. Use the speaker UUID from the database.
// ═══════════════════════════════════════════════════════════════
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
    a: "Actualmente la experiencia pública destaca 8 áreas activas de especialización: Psicología Clínica, Neuropsicología, Psicología Forense, Psicología Organizacional, Psicología Educativa, Psicogerontología, Psicología Deportiva y Sexología Clínica."
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

function formatCurrency(value: number | null | undefined) {
  return `$${Number(value || 0)} MXN`
}

function formatHours(value: number | null | undefined) {
  const hours = Number(value || 0)
  if (!hours) return null
  return Number.isInteger(hours) ? `${hours} horas` : `${hours.toFixed(1)} horas`
}

export default async function LandingPage() {
  const [allEvents, formations, featuredSpeakers] = await Promise.all([
    getUnifiedCatalogEvents(),
    getPublicFormations(),
    getFeaturedPublicSpeakers(4),
  ])
  const upcomingEvents = splitPublicCatalogEvents(allEvents).upcoming.slice(0, 3)
  const featuredFormations = formations.slice(0, 2)

  return (
    <div className="flex flex-col items-center flex-1 w-full">

      {/* ══════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-black min-h-[90vh] flex items-center">
        {/* Subtle background */}
        <div className="absolute inset-0 -z-0 sapihum-grid-bg opacity-30" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#f6ae02]/5 to-[#7a5602]/3 blur-[120px]" />
        
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-28 md:py-36 lg:py-48">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            {/* Badge — minimal editorial */}
            <div className="sapihum-fade-up inline-flex items-center gap-2 rounded-sm border border-[#f6ae02]/20 bg-[#f6ae02]/5 backdrop-blur-sm px-4 py-1.5 text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-10">
              Academia SAPIHUM | Formación especializada para psicólogos
            </div>

            {/* H1 — Editorial serif/sans mix */}
            <h1 className="sapihum-fade-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-white" style={{ animationDelay: '0.1s' }}>
              Cursos y formaciones especializadas para psicólogos que quieren{" "}
              <span className="font-serif italic font-normal text-[#c0bfbc]">
                crecer con más nivel, criterio y respaldo profesional.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="sapihum-fade-up mt-8 text-lg md:text-xl text-[#c0bfbc]/70 max-w-3xl leading-relaxed font-light" style={{ animationDelay: '0.2s' }}>
              Accede a programas completos, formación continua y rutas de especialización diseñadas para fortalecer tu práctica, actualizarte con seriedad y diferenciarte en un entorno cada vez más exigente.
            </p>

            {/* CTA Buttons — Luxury style */}
            <div className="sapihum-fade-up mt-12 flex flex-col sm:flex-row gap-5 w-full sm:w-auto uppercase text-xs tracking-[0.1em]" style={{ animationDelay: '0.3s' }}>
              <Link href="/formaciones" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-13 px-10 font-bold">
                  Ver Formaciones
                </Button>
              </Link>
              <Link href="/membresia" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-13 px-10 font-bold">
                  Conocer Membresía
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          2. BLOQUE DE CREDIBILIDAD
      ══════════════════════════════════════════════════ */}
      <section className="w-full border-b border-white/[0.08] bg-black py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-60">
            {CREDIBILITY_PILLS.map((pill) => (
              <div key={pill} className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f6ae02] mr-3" />
                {pill}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. QUÉ ES SAPIHUM
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full py-32 border-b border-white/[0.06] overflow-hidden bg-black">
        {/* Imagen de fondo con soporte WebP automático en Cloudinary */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://res.cloudinary.com/dguo9gbxd/image/upload/f_auto,q_auto/v1775704950/PSICOLOGIA_AVANZADA_E_INVESTIGACION_HUMANA_1_whpj2o.jpg')" }}
        />
        {/* Gradiente sutil para mejorar legibilidad conectando el negro del fondo */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black via-black/40 to-black" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-4">
            El Ecosistema
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white drop-shadow-md">
            Qué es SAPIHUM
          </h2>
          <p className="mt-8 text-xl text-[#c0bfbc] leading-relaxed font-light drop-shadow-sm">
            SAPIHUM es un ecosistema profesional en línea para psicólogos que buscan crecer con <span className="text-white font-semibold">mayor profundidad, estructura y respaldo</span>. Integramos todas las piezas del rompecabezas profesional en un solo lugar.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. ESPECIALIDADES (SEO-friendly grid)
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-32 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
                Áreas de{" "}
                <span className="font-serif italic font-normal text-[#f6ae02]">especialización</span>
              </h2>
              <div className="h-px w-20 bg-[#7a5602]" />
            </div>
            <p className="text-[#c0bfbc]/50 max-w-sm text-sm font-light leading-relaxed">
              Cada especialidad integra formación, actualización, recursos y comunidad para fortalecer tu ejercicio profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] sapihum-stagger">
            {SPECIALTIES.map((spec, idx) => {
              const background = SPECIALTY_BACKGROUNDS[spec.code]

              return (
                <Link
                  key={spec.code}
                  href={`/especialidades/${spec.slug}`}
                  className="group relative isolate min-h-[320px] overflow-hidden bg-black"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{
                      backgroundImage: `url('${background?.image ?? SPECIALTY_BACKGROUNDS.clinica.image}')`,
                      backgroundPosition: background?.position ?? "center",
                    }}
                  />
                  <div className="absolute inset-0 bg-black/55 transition-colors duration-500 group-hover:bg-black/45" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/25" />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#f6ae02]/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative z-10 flex h-full flex-col justify-between p-10">
                    <div>
                      <div className="mb-6 font-serif text-2xl text-[#f6ae02] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
                        {String(idx + 1).padStart(2, '0')}.
                      </div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors duration-500 group-hover:text-[#f6ae02]">
                        {spec.name}
                      </h3>
                      <p className="max-w-[18rem] text-xs leading-relaxed text-white/78">
                        {spec.tagline}
                      </p>
                    </div>
                    <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#f6ae02]">
                      Descubrir <span className="ml-1 transition-transform duration-500 group-hover:translate-x-2">→</span>
                    </div>
                  </div>
                </Link>
              )
            })}

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. INVESTIGACIÓN APLICADA
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full py-32 bg-background overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-8">
              <p className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-4">
                Ciencia & Rigor
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-10 text-white">
                Investigación aplicada para una{" "}
                <span className="font-serif italic font-normal text-[#c0bfbc]">práctica institucional.</span>
              </h2>
              <div className="border-l border-white/[0.1] pl-10 py-2">
                <p className="text-xl text-[#c0bfbc]/70 leading-relaxed font-light">
                  En SAPIHUM impulsamos una visión donde la formación, la práctica profesional y la investigación se conectan para generar más criterio, mejores decisiones y mayor profundidad clínica y profesional.
                </p>
              </div>
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <div className="w-full border border-white/[0.08] p-10 flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 bg-[#f6ae02]/10 rounded-full flex items-center justify-center mb-6">
                  <Beaker className="w-8 h-8 text-[#f6ae02]" />
                </div>
                <h3 className="font-bold text-lg mb-4 text-foreground">Líneas de investigación activas</h3>
                <p className="text-sm text-muted-foreground mb-8 font-light italic">
                  &ldquo;Nuestros hallazgos alimentan directamente los protocolos ofrecidos en el ecosistema.&rdquo;
                </p>
                <span className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.15em]">
                  Explorar ciencia SAPIHUM
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          8. RECURSOS Y HERRAMIENTAS (Software) — Minimalista
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden border-b border-white/[0.06] bg-[#030303] py-28 md:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.24]"
          style={{
            backgroundImage: `url('${PLATFORM_SECTION_BACKGROUND.image}')`,
            backgroundPosition: PLATFORM_SECTION_BACKGROUND.position,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(246,174,2,0.1),transparent_42%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/76 via-black/72 to-[#030303]/88" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Mucho más que formación
            </p>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
              Formación, software clínico y membresía en una misma experiencia
            </h2>
            <p className="mt-6 text-base font-light leading-relaxed text-[#c0bfbc]/60">
              Además de la academia, existe un ecosistema que te ayuda a operar con más orden, seguimiento y respaldo profesional.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left: Platform features — clean grid */}
            <div>
              <h3 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">
                Infraestructura profesional conectada
              </h3>
              <p className="mb-8 text-sm font-light leading-relaxed text-[#c0bfbc]/60">
                No solo aprendes: también puedes organizar tu consulta y trabajar con mejor soporte clínico y tecnológico.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PLATFORM_FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-500 hover:border-[#f6ae02]/15"
                  >
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-black text-[#c0bfbc] transition-colors duration-500 group-hover:text-[#f6ae02]">
                      {feature.icon}
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {feature.title}
                    </h4>
                    <p className="mt-2 text-xs font-light leading-relaxed text-[#c0bfbc]/55">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Nivel 2 showcase — simplified, no nested info box */}
            <div className="flex flex-col">
              <div className="flex-1 rounded-xl border border-white/[0.08] bg-[#050505] p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    {PRICING_PLAN_COPY.level2.levelLabel}
                  </span>
                  {PRICING_PLAN_COPY.level2.badge && (
                    <span className="inline-flex items-center rounded-full border border-[#f6ae02]/20 bg-[#f6ae02]/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f6ae02]">
                      {PRICING_PLAN_COPY.level2.badge}
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
                  {PRICING_PLAN_COPY.level2.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-[#c0bfbc]/60">
                  {PRICING_PLAN_COPY.level2.note}
                </p>

                {/* Benefits — simple list, no cards-within-cards */}
                <ul className="mt-6 space-y-2.5">
                  {LEVEL_2_SHOWCASE_BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <span className="text-[#f6ae02] text-sm">+</span>
                      <span className="text-sm text-[#c0bfbc]/70">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link href="/membresia">
                    <Button variant="outline" className="gap-2 font-bold uppercase text-[10px] tracking-[0.1em]">
                      Conocer membresía
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <p className="mt-3 text-[11px] font-light text-[#c0bfbc]/35">
                Nivel 2 aparece como ejemplo de la capa más completa dentro de SAPIHUM.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          8.5. PRÓXIMOS EVENTOS
      ══════════════════════════════════════════════════ */}
      {featuredFormations.length > 0 && (
        <section className="w-full py-24 bg-[#050505] border-b border-white/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
              <div className="max-w-3xl">
                <p className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-4">
                  Academia SAPIHUM
                </p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                  Cursos y formaciones para psicólogos que quieren avanzar con más estructura, criterio y aplicación real
                </h2>
                <p className="mt-3 text-muted-foreground font-light">
                  Explora la oferta académica de SAPIHUM: desde cursos especializados hasta formaciones completas, diseñadas para ayudarte a profundizar, actualizarte y fortalecer tu práctica profesional.
                </p>
              </div>
              <Link href="/academia" className="shrink-0">
                <Button variant="outline" className="gap-2 font-bold uppercase text-[10px] tracking-[0.1em]">
                  Ver cursos y formaciones
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredFormations.map((formation) => {
                const specialization = getSpecializationByCode(formation.specialization_code)
                const totalHours = formatHours(formation.total_hours)

                return (
                  <Link
                    key={formation.id}
                    href={`/formaciones/${formation.slug}`}
                    className="group flex flex-col overflow-hidden border border-white/[0.08] bg-black transition-all duration-500 hover:border-[#f6ae02]/20"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-black via-[#2c2c2b] to-[#7a5602]/40">
                      {formation.image_url ? (
                        <Image
                          src={formation.image_url}
                          alt={formation.title}
                          fill
                          unoptimized
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BrandWordmark className="text-2xl text-white/10 sm:text-3xl lg:text-4xl lg:tracking-[0.18em]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 inline-flex items-center rounded-sm px-2.5 py-1 text-[10px] font-bold text-black uppercase tracking-wider bg-[#f6ae02]">
                        Academia
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {specialization && (
                          <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                            {specialization.name}
                          </span>
                        )}
                        {totalHours && (
                          <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                            {totalHours}
                          </span>
                        )}
                      </div>
                      <h3 className="line-clamp-2 text-2xl font-semibold leading-snug group-hover:text-[#f6ae02] transition-colors duration-500">
                        {formation.title}
                      </h3>
                      {formation.subtitle && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {formation.subtitle}
                        </p>
                      )}
                      <div className="flex-1" />
                      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                        <div>
                          <span className="block text-[10px] font-bold text-[#c0bfbc]/50 uppercase tracking-[0.15em]">
                            Disponible en Academia
                          </span>
                          <span className="text-base font-bold">{formatCurrency(formation.bundle_price)}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-wider">Ver detalles</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {upcomingEvents.length > 0 && (
        <section className="w-full py-32 bg-background border-b border-white/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-16">
              <div>
                <p className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-4">
                  Academia SAPIHUM
                </p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                  Próximos en la Academia
                </h2>
                <p className="mt-3 text-muted-foreground font-light">
                  Talleres, formaciones, conferencias y experiencias en vivo para la comunidad.
                </p>
              </div>
              <Link href="/academia" className="shrink-0">
                <Button variant="outline" className="gap-2 font-bold uppercase text-[10px] tracking-[0.1em]">
                  Explorar Academia
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
                    className="group flex flex-col overflow-hidden border border-white/[0.08] bg-black transition-all duration-500 hover:border-[#f6ae02]/20"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-black via-[#2c2c2b] to-[#7a5602]/40">
                      {event.image_url ? (
                        <Image
                          src={event.image_url}
                          alt={event.title}
                          fill
                          unoptimized
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CalendarDays className="h-12 w-12 text-white/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className={`absolute top-3 left-3 inline-flex items-center rounded-sm px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider ${typeBadge.color}`}>
                        {typeBadge.label}
                      </span>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-sm bg-black/80 px-2.5 py-1.5 backdrop-blur-sm">
                        <CalendarDays className="h-3.5 w-3.5 text-[#f6ae02]" />
                        <span className="text-xs font-semibold text-white">{dateStr}</span>
                        <span className="text-[10px] text-[#c0bfbc]/60">{timeStr}</span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      {speakerName && (
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{speakerName}</p>
                      )}
                      <h3 className="line-clamp-2 text-lg font-semibold leading-snug group-hover:text-[#f6ae02] transition-colors duration-500">
                        {event.title}
                      </h3>
                      <div className="flex-1" />
                      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                        {price > 0 ? (
                          <span className="text-base font-bold">${price.toFixed(0)} MXN</span>
                        ) : (
                          <span className="text-sm font-bold text-[#f6ae02]">Gratis</span>
                        )}
                        <span className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-wider">Ver detalles →</span>
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
          10. DOCENTES DESTACADOS
      ══════════════════════════════════════════════════ */}
      {featuredSpeakers.length > 0 && (
      <section className="w-full py-32 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-4">
              Docentes destacados
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
              Aprende con docentes de {" "}
              <span className="font-serif italic font-normal text-[#c0bfbc]">
                alto nivel académico
              </span> {" "}
              y reconocimiento real
            </h2>
            <p className="text-[#c0bfbc]/70 text-lg font-light leading-relaxed">
              En SAPIHUM reunimos docentes con trayectoria sólida, formación avanzada y experiencia académica, para construir programas con mayor profundidad, claridad y aplicación real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06]">
            {featuredSpeakers.map((speaker) => {
              const name = speaker.profile?.full_name || 'Ponente'
              const photoUrl = speaker.photo_url || speaker.profile?.avatar_url
              const mainSpecialty = speaker.specialties?.[0]
              const credential = speaker.credentials?.length > 0 ? speaker.credentials.join(' · ') : speaker.headline

              return (
                <Link
                  key={speaker.id}
                  href={`/speakers/${speaker.id}`}
                  className="group relative bg-[#030303] p-8 hover:bg-black transition-all duration-500 overflow-hidden text-left"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#f6ae02]/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="w-20 h-20 rounded-sm bg-[#2c2c2b] flex items-center justify-center mb-6 border border-white/[0.08] relative overflow-hidden">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt={name}
                        fill
                        unoptimized
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="relative z-10 text-[#c0bfbc] font-serif italic text-3xl">
                        {name.split(' ')[1]?.[0] || name[0]}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent z-0" />
                  </div>

                  {mainSpecialty && (
                    <div className="text-[10px] text-[#f6ae02] font-bold uppercase tracking-[0.15em] mb-3">
                      {mainSpecialty}
                    </div>
                  )}

                  <h3 className="font-bold text-lg text-white mb-2 group-hover:text-[#f6ae02] transition-colors duration-500">{name}</h3>

                  {credential && (
                    <div className="text-xs text-[#c0bfbc] font-semibold mb-5 bg-white/5 inline-block px-2.5 py-1 rounded-sm border border-white/10 line-clamp-2">
                      {credential}
                    </div>
                  )}

                  {speaker.headline && speaker.credentials?.length > 0 && (
                    <p className="text-xs text-[#c0bfbc]/50 leading-relaxed font-light mt-auto">
                      {speaker.headline}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>

          <div className="mt-16 text-center">
            <Link href="/speakers">
              <Button variant="outline" className="gap-2 font-bold uppercase text-[10px] tracking-[0.1em] h-12 px-8 border-white/20 hover:bg-white/5 text-[#c0bfbc] hover:text-white transition-colors">
                Conocer cuerpo docente
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      )}
      {/* ══════════════════════════════════════════════════
          11. FAQ SEO
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-32 bg-[#030303] border-y border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-serif italic">Consultas frecuentes</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <details key={idx} className="group border-b border-white/[0.06] pb-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                <summary className="flex items-center justify-between outline-none">
                  <span className="text-lg font-light text-white group-open:text-[#f6ae02] transition-all">{faq.q}</span>
                  <span className="ml-4 text-[#f6ae02] text-xl font-light transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <div className="pt-6 text-sm text-[#c0bfbc]/50 leading-relaxed font-light">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          12. FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-40 bg-black">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="absolute inset-0 bg-[#f6ae02]/3 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white mb-6">
              Empieza por la formación que mejor encaje con tu siguiente etapa profesional
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-[#c0bfbc]/60 font-light leading-relaxed">
              Explora cursos, programas y formaciones completas dentro de la Academia SAPIHUM. Y si buscas una experiencia más amplia, conoce también la membresía.
            </p>
            
            <div className="mt-16 flex flex-col sm:flex-row gap-6 justify-center items-center uppercase text-xs tracking-[0.1em]">
              <Link href="/formaciones" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-12 font-bold">
                  Ver Formaciones
                </Button>
              </Link>
              <Link href="/membresia" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-14 px-12 font-bold">
                  Conocer Membresía
                </Button>
              </Link>
            </div>
            <p className="mt-10 text-[11px] text-[#c0bfbc]/40">
              Formación especializada para psicólogos. Acceso y beneficios sujetos al tipo de programa o membresía.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
