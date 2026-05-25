import Link from "next/link"
import Image from "next/image"
import { PublicCatalogCard } from "@/components/catalog/public-catalog-card"
import { Button } from "@/components/ui/button"
import { getMarketingSpecializations } from "@/lib/specializations"
import { getPublicCatalogEvents } from "@/lib/supabase/queries/events"
import { splitPublicCatalogEvents } from "@/lib/events/public"
import { FREE_REGISTRATION_LIMITATION, MEMBERSHIP_TIERS } from "@/lib/membership"
import { LEVEL_2_CARD_FEATURE_IDS, PRICING_PLAN_COPY, getPricingFeatureTitles } from "@/lib/pricing-catalog"
import { getFeaturedPublicSpeakers } from "@/lib/supabase/queries/speakers"
import { getSpeakerHeadline, getSpeakerImage, getSpeakerName } from "@/lib/speakers/display"
import { Shield, Users, BookOpen, Scaling, Beaker, FileText, Smartphone, ArrowRight } from "lucide-react"

export const metadata = {
  title: "SAPIHUM | Comunidad Profesional de Psicología Avanzada",
  description: "Cursos y formaciones especializadas para psicólogos que buscan crecer con más estructura, criterio y respaldo profesional.",
  openGraph: {
    title: "SAPIHUM | Comunidad Profesional de Psicología Avanzada",
    description: "Academia SAPIHUM: cursos, formaciones, membresía profesional y herramientas para fortalecer la práctica psicológica.",
    type: "website",
  },
}

// PERF: ISR — reduced from 3600s to 300s to match catalog event TTL.
export const revalidate = 300

const SPECIALTIES = getMarketingSpecializations()

type SpecialtyBackground = {
  /**
   * URL de Cloudinary para producción.
   * Cuando esté disponible, se usa sobre el placeholder.
   * Formato recomendado: f_auto,q_auto,w_1400
   */
  cloudinaryUrl?: string
  /** Imagen placeholder de Unsplash (temporal hasta tener imagen propia en Cloudinary) */
  placeholder: string
  position?: string
}

/**
 * Imágenes de fondo por especialidad.
 * Para migrar a Cloudinary: añade `cloudinaryUrl` en cada entrada.
 * El componente usará cloudinaryUrl si existe, si no cae al placeholder.
 */
const SPECIALTY_BACKGROUNDS: Record<string, SpecialtyBackground> = {
  evaluacion_clinica: {
    placeholder: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80',
    position: 'center 30%',
    // cloudinaryUrl: 'https://res.cloudinary.com/dguo9gbxd/image/upload/f_auto,q_auto,w_1400/v1/sapihum/especialidades/evaluacion-clinica',
  },
  tcc: {
    placeholder: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&w=1400&q=80',
    position: 'center 40%',
    // cloudinaryUrl: 'https://res.cloudinary.com/dguo9gbxd/image/upload/f_auto,q_auto,w_1400/v1/sapihum/especialidades/tcc',
  },
  terapias_contextuales: {
    placeholder: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1400&q=80',
    position: 'center',
    // cloudinaryUrl: 'https://res.cloudinary.com/dguo9gbxd/image/upload/f_auto,q_auto,w_1400/v1/sapihum/especialidades/terapias-contextuales',
  },
  regulacion_emocional: {
    placeholder: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1400&q=80',
    position: 'center 35%',
    // cloudinaryUrl: 'https://res.cloudinary.com/dguo9gbxd/image/upload/f_auto,q_auto,w_1400/v1/sapihum/especialidades/regulacion-emocional',
  },
  trauma: {
    placeholder: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1400&q=80',
    position: 'center 45%',
    // cloudinaryUrl: 'https://res.cloudinary.com/dguo9gbxd/image/upload/f_auto,q_auto,w_1400/v1/sapihum/especialidades/trauma-psicologico',
  },
  ansiedad_depresion: {
    placeholder: 'https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?auto=format&fit=crop&w=1400&q=80',
    position: 'center 25%',
    // cloudinaryUrl: 'https://res.cloudinary.com/dguo9gbxd/image/upload/f_auto,q_auto,w_1400/v1/sapihum/especialidades/ansiedad-depresion',
  },
  pareja_familia: {
    placeholder: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80',
    position: 'center',
    // cloudinaryUrl: 'https://res.cloudinary.com/dguo9gbxd/image/upload/f_auto,q_auto,w_1400/v1/sapihum/especialidades/pareja-familia',
  },
  supervision_clinica: {
    placeholder: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80',
    position: 'center 30%',
    // cloudinaryUrl: 'https://res.cloudinary.com/dguo9gbxd/image/upload/f_auto,q_auto,w_1400/v1/sapihum/especialidades/supervision-clinica',
  },
}

const PLATFORM_SECTION_BACKGROUND = {
  image: "https://images.unsplash.com/photo-1758273241086-f3585ef8c2f8?auto=format&fit=crop&w=2400&q=80",
  position: "center 34%",
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

void WHAT_YOU_GET

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
const FREE_REGISTRATION_FEATURES = MEMBERSHIP_TIERS[0].features

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
    a: "La vertical de Psicología Clínica integra 8 áreas de formación continua: Evaluación Clínica, Terapia Cognitivo-Conductual, Terapias Contextuales (ACT y mindfulness), Regulación Emocional, Trauma Psicológico, Ansiedad y Depresión, Pareja y Familia, y Supervisión Clínica. Cada área ofrece eventos, cursos y formaciones con enfoque aplicado."
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
  const [catalogEvents, featuredSpeakers] = await Promise.all([
    getPublicCatalogEvents('eventos'),
    getFeaturedPublicSpeakers(4),
  ])
  const featuredEvents = splitPublicCatalogEvents(catalogEvents).upcoming.slice(0, 3)

  return (
    <div className="marketing-long-page flex flex-col items-center flex-1 w-full">

      {/* ══════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative flex w-full items-center overflow-hidden bg-background min-h-[76svh] md:min-h-[82svh]">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_18%_10%,rgba(219,234,254,0.78),transparent_34%),radial-gradient(circle_at_82%_80%,rgba(240,253,250,0.72),transparent_30%),linear-gradient(180deg,#ffffff_0%,#fafaf9_56%,#f7fbff_100%)]" />
        <div className="absolute inset-0 -z-0 sapihum-grid-bg opacity-[0.18]" />
        
        <div className="relative z-10 mx-auto max-w-[88rem] px-4 py-20 sm:px-6 md:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
            <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-brand-blue-border bg-brand-blue-soft/80 px-5 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-blue-dark shadow-sm">
              <Shield className="h-3.5 w-3.5 fill-brand-blue text-brand-blue" />
              Para profesionales de la salud mental
            </div>

            <h1 className="font-serif text-[clamp(2.85rem,4.65vw,5.85rem)] font-bold leading-[1.04] tracking-normal text-brand-text-strong">
              <span className="block md:whitespace-nowrap">La comunidad para los</span>
              <span className="block md:whitespace-nowrap">profesionales del</span>
              <span className="block pt-2 text-[0.88em] italic font-bold text-brand-text md:whitespace-nowrap">
                comportamiento <span className="text-brand-blue-dark">humano.</span>
              </span>
            </h1>

            <div className="mt-10 max-w-3xl text-xl leading-relaxed text-brand-text-muted md:text-2xl">
              <p>Psicólogos, Terapeutas, Consultores y Educadores.</p>
              <p className="font-semibold text-brand-text">Diferentes trincheras, una misma misión:</p>
              <p>Impactar vidas con ética y rigor.</p>
            </div>

            <div className="mt-14 flex w-full flex-col gap-5 text-sm sm:w-auto sm:flex-row">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto"
                data-analytics-cta
                data-analytics-label="Hero Unirme Comunidad"
                data-analytics-surface="home_hero"
                data-analytics-funnel="registration"
              >
                <Button size="lg" className="h-14 w-full px-10 text-base font-bold normal-case tracking-normal">
                  Unirme a la Comunidad
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="/nosotros"
                className="w-full sm:w-auto"
                data-analytics-cta
                data-analytics-label="Hero Conocer Mas"
                data-analytics-surface="home_hero"
                data-analytics-funnel="landing"
              >
                <Button size="lg" variant="outline" className="h-14 w-full px-10 text-base font-bold normal-case tracking-normal">
                  Conocer Más
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          2. BLOQUE DE CREDIBILIDAD
      ══════════════════════════════════════════════════ */}
      <section className="w-full border-b border-border/[0.08] bg-background py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {CREDIBILITY_PILLS.map((pill) => (
              <div key={pill} className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mr-3" />
                {pill}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. QUÉ ES SAPIHUM
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full py-32 border-b border-border/[0.06] overflow-hidden bg-background">
        {/* Imagen de fondo con soporte WebP automático en Cloudinary */}
        <Image
          src="https://res.cloudinary.com/dguo9gbxd/image/upload/f_auto,q_auto/v1775704950/PSICOLOGIA_AVANZADA_E_INVESTIGACION_HUMANA_1_whpj2o.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={72}
          className="absolute inset-0 z-0 object-cover object-center opacity-[0.82]"
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/72 via-background/28 to-background/84" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-4">
            El Ecosistema
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-foreground drop-shadow-md">
            Qué es SAPIHUM
          </h2>
          <p className="mt-8 text-xl leading-relaxed text-brand-text font-medium drop-shadow-[0_1px_14px_rgba(255,255,255,0.9)]">
            SAPIHUM es un ecosistema profesional en línea para psicólogos que buscan crecer con <span className="text-foreground font-semibold">mayor profundidad, estructura y respaldo</span>. Integramos todas las piezas del rompecabezas profesional en un solo lugar.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. ESPECIALIDADES (SEO-friendly grid)
      ══════════════════════════════════════════════════ */}
      <section className="w-full py-32 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-foreground">
                Áreas de{" "}
                <span className="font-serif italic font-normal text-[#2563EB]">especialización</span>
              </h2>
              <div className="h-px w-20 bg-[#1E3A8A]" />
            </div>
            <p className="text-brand-text-muted max-w-sm text-sm font-light leading-relaxed">
              Cada especialidad integra formación, actualización, recursos y comunidad para fortalecer tu ejercicio profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/[0.06] border border-border/[0.06] sapihum-stagger">
            {SPECIALTIES.map((spec, idx) => {
              const background = SPECIALTY_BACKGROUNDS[spec.code]

              return (
                <Link
                  key={spec.code}
                  href={`/especialidades/${spec.slug}`}
                  className="group relative isolate min-h-[320px] overflow-hidden bg-background"
                >
                  <Image
                    src={background?.cloudinaryUrl ?? background?.placeholder ?? SPECIALTY_BACKGROUNDS.evaluacion_clinica.placeholder}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    quality={52}
                    className="absolute inset-0 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{
                      objectPosition: background?.position ?? "center",
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-950/28 transition-colors duration-500 group-hover:bg-slate-950/18" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-950/38 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative z-10 flex h-full flex-col justify-between p-10">
                    <div>
                      <div className="mb-6 font-serif text-2xl text-[#2563EB] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
                        {String(idx + 1).padStart(2, '0')}.
                      </div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors duration-500 group-hover:text-brand-blue-soft">
                        {spec.name}
                      </h3>
                      <p className="max-w-[18rem] text-xs leading-relaxed text-white/82">
                        {spec.tagline}
                      </p>
                    </div>
                    <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">
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
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-4">
                Ciencia & Rigor
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-10 text-foreground">
                Investigación aplicada para una{" "}
                <span className="font-serif italic font-normal text-brand-text-muted">práctica institucional.</span>
              </h2>
              <div className="border-l border-border/[0.1] pl-10 py-2">
                <p className="text-xl text-brand-text-muted leading-relaxed font-light">
                  En SAPIHUM impulsamos una visión donde la formación, la práctica profesional y la investigación se conectan para generar más criterio, mejores decisiones y mayor profundidad clínica y profesional.
                </p>
              </div>
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <div className="w-full border border-border/[0.08] p-10 flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 bg-[#2563EB]/10 rounded-full flex items-center justify-center mb-6">
                  <Beaker className="w-8 h-8 text-[#2563EB]" />
                </div>
                <h3 className="font-bold text-lg mb-4 text-foreground">Líneas de investigación activas</h3>
                <p className="text-sm text-muted-foreground mb-8 font-light italic">
                  &ldquo;Nuestros hallazgos alimentan directamente los protocolos ofrecidos en el ecosistema.&rdquo;
                </p>
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.15em]">
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
      <section className="relative w-full overflow-hidden border-b border-border/[0.06] bg-background py-28 md:py-32">
        <Image
          src={PLATFORM_SECTION_BACKGROUND.image}
          alt=""
          fill
          sizes="100vw"
          quality={52}
          className="absolute inset-0 object-cover opacity-[0.62]"
          style={{
            objectPosition: PLATFORM_SECTION_BACKGROUND.position,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.1),transparent_42%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/78 via-background/48 to-background/88" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB]">
              Mucho más que formación
            </p>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              Formación, software clínico y membresía en una misma experiencia
            </h2>
            <p className="mt-6 text-base font-light leading-relaxed text-brand-text-muted">
              Además de la academia, existe un ecosistema que te ayuda a operar con más orden, seguimiento y respaldo profesional.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left: Platform features — clean grid */}
            <div>
              <h3 className="mb-6 text-xl font-bold tracking-tight text-foreground md:text-2xl">
                Infraestructura profesional conectada
              </h3>
              <p className="mb-8 text-sm font-light leading-relaxed text-brand-text-muted">
                No solo aprendes: también puedes organizar tu consulta y trabajar con mejor soporte clínico y tecnológico.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PLATFORM_FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="group rounded-xl border border-border/[0.06] bg-white/[0.02] p-5 transition-all duration-500 hover:border-[#2563EB]/15"
                  >
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/[0.06] bg-background text-brand-text-muted transition-colors duration-500 group-hover:text-[#2563EB]">
                      {feature.icon}
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      {feature.title}
                    </h4>
                    <p className="mt-2 text-xs font-light leading-relaxed text-brand-text-muted">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Nivel 2 showcase — simplified, no nested info box */}
            <div className="flex flex-col">
              <div className="flex-1 rounded-xl border border-border/[0.08] bg-background p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
                    {PRICING_PLAN_COPY.level2.levelLabel}
                  </span>
                  {PRICING_PLAN_COPY.level2.badge && (
                    <span className="inline-flex items-center rounded-full border border-[#2563EB]/20 bg-[#2563EB]/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
                      {PRICING_PLAN_COPY.level2.badge}
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                  {PRICING_PLAN_COPY.level2.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-brand-text-muted">
                  {PRICING_PLAN_COPY.level2.note}
                </p>

                {/* Benefits — simple list, no cards-within-cards */}
                <div className="mt-5 border-y border-border/[0.08] py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
                      Registro Gratuito
                    </span>
                    <span className="text-sm font-semibold text-foreground">$0/mes</span>
                  </div>
                  <p className="mt-2 text-sm font-light leading-relaxed text-brand-text-muted">
                    Registro sin costo para entrar a la comunidad y a eventos abiertos.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {FREE_REGISTRATION_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <span className="text-[#2563EB] text-sm">+</span>
                        <span className="text-sm text-brand-text-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-brand-text-muted">
                    {FREE_REGISTRATION_LIMITATION}
                  </p>
                </div>

                <ul className="mt-6 space-y-2.5">
                  {LEVEL_2_SHOWCASE_BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <span className="text-[#2563EB] text-sm">+</span>
                      <span className="text-sm text-brand-text-muted">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/auth/register"
                    className="w-full sm:w-auto"
                    data-analytics-cta
                    data-analytics-label="Nivel 2 Registro Gratuito"
                    data-analytics-surface="home_membership_showcase"
                    data-analytics-funnel="registration"
                  >
                    <Button className="w-full gap-2 font-bold uppercase text-[10px] tracking-[0.1em]">
                      Crear cuenta gratis
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link
                    href="/membresia"
                    className="w-full sm:w-auto"
                    data-analytics-cta
                    data-analytics-label="Nivel 2 Conocer Membresia"
                    data-analytics-surface="home_membership_showcase"
                    data-analytics-funnel="checkout"
                  >
                    <Button variant="outline" className="w-full gap-2 font-bold uppercase text-[10px] tracking-[0.1em]">
                      Conocer membresía
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <p className="mt-3 text-[11px] font-light text-brand-text-muted">
                Nivel 2 aparece como ejemplo de la capa más completa dentro de SAPIHUM.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          8.5. PRÓXIMOS EVENTOS
      ══════════════════════════════════════════════════ */}
      {featuredEvents.length > 0 && (
        <section className="w-full py-24 bg-background border-b border-border/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
              <div className="max-w-3xl">
                <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-4">
                  Agenda SAPIHUM
                </p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  Próximos eventos para psicólogos que quieren actualizarse y conectar con la comunidad
                </h2>
                <p className="mt-3 text-muted-foreground font-light">
                  Conferencias, talleres y encuentros en vivo diseñados para fortalecer tu práctica profesional con temas actuales y ponentes especializados.
                </p>
              </div>
              <Link href="/eventos" className="shrink-0">
                <Button variant="outline" className="gap-2 font-bold uppercase text-[10px] tracking-[0.1em]">
                  Ver eventos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredEvents.map((event) => (
                <PublicCatalogCard key={event.id} event={event} fixedLayout />
              ))}
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
            <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-4">
              Docentes destacados
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6">
              Aprende con docentes de {" "}
              <span className="font-serif italic font-normal text-brand-text-muted">
                alto nivel académico
              </span> {" "}
              y reconocimiento real
            </h2>
            <p className="text-brand-text-muted text-lg font-light leading-relaxed">
              En SAPIHUM reunimos docentes con trayectoria sólida, formación avanzada y experiencia académica, para construir programas con mayor profundidad, claridad y aplicación real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredSpeakers.map((speaker) => {
              const name = getSpeakerName(speaker)
              const photoUrl = getSpeakerImage(speaker)
              const headline = getSpeakerHeadline(speaker)
              const mainSpecialty = speaker.specialties?.[0]
              const credential = speaker.credentials?.length > 0 ? speaker.credentials.join(' · ') : headline

              return (
                <Link
                  key={speaker.id}
                  href={`/speakers/${speaker.id}`}
                  className="group cursor-pointer block"
                >
                  {/* Portrait photo with duotone warm hover */}
                  <div className="relative w-full aspect-[4/5] bg-background mb-5 overflow-hidden rounded-md border border-border/[0.06]">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt={name}
                        fill
                        quality={58}
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-all duration-700 opacity-95 group-hover:opacity-100 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-brand-blue-soft">
                        <span className="text-brand-text-disabled font-serif italic text-6xl">
                          {name.split(' ')[1]?.[0] || name[0]}
                        </span>
                      </div>
                    )}

                    {/* Blue duotone tint on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-[0.28] transition-opacity duration-500 pointer-events-none"
                      style={{ backgroundColor: '#2563EB', mixBlendMode: 'multiply' as any }}
                    />

                    {/* Bottom gradient for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/86 via-slate-950/16 to-transparent" />

                    {/* Name and specialty overlay */}
                    <div className="absolute bottom-4 left-4 right-4 z-10">
                      {mainSpecialty && (
                        <p className="text-[10px] text-brand-blue-soft uppercase tracking-widest font-semibold mb-1 group-hover:text-white transition-colors">
                          {mainSpecialty}
                        </p>
                      )}
                      <h3 className="text-xl font-serif text-white leading-tight">{name}</h3>
                    </div>
                  </div>

                  {/* Credentials below the photo */}
                  <div className="pl-4 border-l border-border/[0.08] group-hover:border-[#2563EB] transition-colors duration-300">
                    {credential && (
                      <p className="text-xs text-brand-text-muted mb-2 leading-relaxed line-clamp-2">
                        {credential}
                      </p>
                    )}
                    {headline && speaker.credentials?.length > 0 && (
                      <p className="text-[10px] uppercase tracking-wide text-brand-text-muted">
                        {headline}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="mt-16 text-center">
            <Link href="/speakers">
              <Button variant="outline" className="gap-2 font-bold uppercase text-[10px] tracking-[0.1em] h-12 px-8 border-border/20 hover:bg-white/5 text-brand-text-muted hover:text-foreground transition-colors">
                Conocer cuerpo docente
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      )}
      <section className="w-full py-32 bg-background border-y border-border/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-serif italic">Consultas frecuentes</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <details key={idx} className="group border-b border-border/[0.06] pb-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                <summary className="flex items-center justify-between outline-none">
                  <span className="text-lg font-light text-foreground group-open:text-[#2563EB] transition-all">{faq.q}</span>
                  <span className="ml-4 text-[#2563EB] text-xl font-light transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <div className="pt-6 text-sm text-brand-text-muted leading-relaxed font-light">
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
      <section className="w-full py-40 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="absolute inset-0 bg-[#2563EB]/3 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-foreground mb-6">
              Empieza por la formación que mejor encaje con tu siguiente etapa profesional
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-brand-text-muted font-light leading-relaxed">
              Explora cursos, programas y formaciones completas dentro de la Academia SAPIHUM. Y si buscas una experiencia más amplia, conoce también la membresía.
            </p>
            
            <div className="mt-16 flex flex-col sm:flex-row gap-6 justify-center items-center uppercase text-xs tracking-[0.1em]">
              <Link
                href="/formaciones"
                className="w-full sm:w-auto"
                data-analytics-cta
                data-analytics-label="Final CTA Ver Formaciones"
                data-analytics-surface="home_final_cta"
                data-analytics-funnel="landing"
              >
                <Button size="lg" className="w-full h-14 px-12 font-bold">
                  Ver Formaciones
                </Button>
              </Link>
              <Link
                href="/membresia"
                className="w-full sm:w-auto"
                data-analytics-cta
                data-analytics-label="Final CTA Conocer Membresia"
                data-analytics-surface="home_final_cta"
                data-analytics-funnel="checkout"
              >
                <Button size="lg" variant="outline" className="w-full h-14 px-12 font-bold">
                  Conocer Membresía
                </Button>
              </Link>
            </div>
            <p className="mt-10 text-[11px] text-brand-text-muted">
              Formación especializada para psicólogos. Acceso y beneficios sujetos al tipo de programa o membresía.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
