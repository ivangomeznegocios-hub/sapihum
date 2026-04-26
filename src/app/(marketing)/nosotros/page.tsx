import Image from "next/image"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BookOpen,
  FlaskConical,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPublicFormations } from "@/app/(marketing)/formaciones/actions"
import { getMarketingSpecializations } from "@/lib/specializations"
import { getPublicSpeakers } from "@/lib/supabase/queries/speakers"

export const metadata = {
  title: "Nosotros | SAPIHUM — Psicología Avanzada e Investigación Humana",
  description:
    "Conoce la historia, los principios y la infraestructura que sostienen a SAPIHUM como ecosistema profesional para psicólogos.",
}

const SPECIALTIES = getMarketingSpecializations()

const EVOLUTION_STEPS = [
  {
    label: "Origen",
    title: "Nacimos como una comunidad que compartía recursos con intención real de elevar la práctica.",
    description:
      "Lo que empezó como un punto de encuentro entre colegas fue revelando una necesidad más profunda: formación especializada, acompañamiento profesional y herramientas que ordenaran el ejercicio clínico con mayor seriedad.",
  },
  {
    label: "Transición",
    title: "Entendimos que una comunidad sin estructura inspira, pero no transforma por sí sola.",
    description:
      "Por eso convertimos ese impulso inicial en una plataforma con academia, especialidades, investigación aplicada y componentes tecnológicos pensados para sostener el trabajo diario del profesional de salud mental.",
  },
  {
    label: "Hoy",
    title: "SAPIHUM es un ecosistema editorial, académico y operativo para psicólogos hispanohablantes.",
    description:
      "No buscamos parecer una marca más del sector. Buscamos construir una referencia seria, útil y científicamente responsable para quienes quieren crecer con más criterio, profundidad y respaldo.",
  },
]

const ECOSYSTEM_PILLARS: Array<{
  icon: LucideIcon
  title: string
  description: string
}> = [
  {
    icon: GraduationCap,
    title: "Academia con criterio",
    description:
      "Diseñamos rutas formativas, programas y espacios de actualización que privilegian profundidad, aplicación clínica y estándares profesionales por encima del ruido comercial.",
  },
  {
    icon: FlaskConical,
    title: "Investigación aplicada",
    description:
      "Entendemos la investigación como una herramienta para dignificar la práctica: generar evidencia, observar patrones reales y devolver conocimiento útil al gremio.",
  },
  {
    icon: ShieldCheck,
    title: "Ética operativa",
    description:
      "Cada decisión de producto, contenido o comunicación debe estar alineada con una responsabilidad clínica, legal y humana; no solo con una estrategia de crecimiento.",
  },
  {
    icon: BookOpen,
    title: "Contenido con intención",
    description:
      "Publicamos y organizamos recursos para orientar mejor la formación del psicólogo moderno, no para inflar catálogos vacíos ni repetir fórmulas de plantilla.",
  },
  {
    icon: Users,
    title: "Red profesional",
    description:
      "Creemos en una comunidad exigente y colaborativa, donde la pertenencia aporta contexto, referencias, intercambio entre pares y sentido de evolución compartida.",
  },
]

const PRINCIPLES = [
  "La evidencia empírica es la base de todo lo que construimos.",
  "La tecnología debe reducir fricción, no complicar el trabajo clínico.",
  "La marca solo tiene sentido si eleva la práctica real del profesional.",
]

export default async function NosotrosPage() {
  const [formations, speakers] = await Promise.all([
    getPublicFormations(),
    getPublicSpeakers(),
  ])

  const featuredSpeakers = speakers.slice(0, 3)

  const stats = [
    {
      value: `${SPECIALTIES.length}`,
      label: "especialidades visibles",
    },
    {
      value: `${formations.length}+`,
      label: "formaciones activas",
    },
    {
      value: `${speakers.length}+`,
      label: "especialistas y docentes públicos",
    },
  ]

  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <section className="relative flex w-full overflow-hidden bg-black">
        <div className="absolute inset-0 sapihum-grid-bg opacity-25" />
        <div className="absolute left-1/2 top-0 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[#f6ae02]/8 blur-[140px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="max-w-4xl">
            <div className="sapihum-fade-up mb-8 inline-flex items-center gap-2 rounded-sm border border-[#f6ae02]/20 bg-[#f6ae02]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Nosotros
            </div>
            <h1
              className="sapihum-fade-up text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ animationDelay: "0.1s" }}
            >
              Un ecosistema serio para psicólogos que quieren{" "}
              <span className="font-serif font-normal italic text-[#c0bfbc]">
                crecer con estructura, ciencia y criterio.
              </span>
            </h1>
            <p
              className="sapihum-fade-up mt-8 max-w-3xl text-lg font-light leading-relaxed text-[#c0bfbc]/75 md:text-xl"
              style={{ animationDelay: "0.2s" }}
            >
              SAPIHUM dejó de ser solo una comunidad para convertirse en una
              infraestructura profesional que conecta formación, especialización,
              investigación y herramientas para la práctica psicológica
              contemporánea.
            </p>

            <div
              className="sapihum-fade-up mt-12 flex flex-col gap-4 sm:flex-row uppercase tracking-[0.1em]"
              style={{ animationDelay: "0.3s" }}
            >
              <Link href="/academia" className="w-full sm:w-auto">
                <Button size="lg" className="h-13 w-full px-10 text-xs font-bold">
                  Explorar Academia
                </Button>
              </Link>
              <Link href="/manifiesto" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 w-full px-10 text-xs font-bold"
                >
                  Leer Manifiesto
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-px border border-white/[0.08] bg-white/[0.08] md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-black/80 px-6 py-8 backdrop-blur-sm md:px-8"
              >
                <div className="text-3xl font-bold text-white md:text-4xl">
                  {stat.value}
                </div>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c0bfbc]/55">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-background py-24 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Nuestra evolución
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              De una comunidad útil a una plataforma que ordena el crecimiento
              profesional.
            </h2>
            <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-muted-foreground">
              Nuestra historia explica por qué existe SAPIHUM y qué busca aportar
              al gremio: estructura, criterio profesional y una forma más seria de
              acompañar el crecimiento de la psicología.
            </p>
          </div>

          <div className="space-y-6">
            {EVOLUTION_STEPS.map((step) => (
              <div
                key={step.label}
                className="border border-white/[0.08] bg-white/[0.02] p-6 transition-colors duration-300 hover:border-[#f6ae02]/20"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                  {step.label}
                </p>
                <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-y border-white/[0.06] bg-[#050505] py-24 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="relative overflow-hidden border border-white/[0.08] bg-black p-8 md:p-10">
            <div className="absolute -right-8 -top-10 text-8xl font-serif text-[#f6ae02]/10">
              “
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Misión
            </p>
            <p className="mt-5 text-2xl font-medium leading-relaxed text-white md:text-3xl">
              Dignificar la práctica psicológica dotando al profesional de
              estructura académica, herramientas útiles y criterio basado en
              evidencia.
            </p>
          </div>

          <div className="relative overflow-hidden border border-white/[0.08] bg-[#0b0b0b] p-8 md:p-10">
            <div className="absolute -right-8 -top-10 text-8xl font-serif text-[#f6ae02]/10">
              “
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Visión
            </p>
            <p className="mt-5 text-2xl font-medium leading-relaxed text-white md:text-3xl">
              Convertirnos en el estándar operativo, académico y científico de
              referencia para la psicología profesional en habla hispana.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full bg-background py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Qué sostiene al ecosistema
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              No vendemos una idea vacía de comunidad; construimos una estructura
              que debe ser útil en la práctica.
            </h2>
          </div>

          <div className="grid gap-px border border-white/[0.06] bg-white/[0.06] md:grid-cols-2 xl:grid-cols-3">
            {ECOSYSTEM_PILLARS.map((pillar) => {
              const Icon = pillar.icon

              return (
                <div key={pillar.title} className="bg-background p-7 md:p-8">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#f6ae02]/20 bg-[#f6ae02]/8 text-[#f6ae02]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {featuredSpeakers.length > 0 && (
        <section className="w-full border-y border-white/[0.06] bg-[#030303] py-24 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                  Red de especialistas
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Personas reales que dan rostro y profundidad al ecosistema
                  SAPIHUM.
                </h2>
                <p className="mt-4 text-lg font-light leading-relaxed text-[#c0bfbc]/70">
                  Especialistas y docentes que hoy dan profundidad académica,
                  criterio clínico y experiencia profesional a la plataforma.
                </p>
              </div>

              <Link href="/speakers" className="shrink-0">
                <Button
                  variant="outline"
                  className="gap-2 font-bold uppercase text-[10px] tracking-[0.1em]"
                >
                  Ver Directorio
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredSpeakers.map((speaker) => {
                const name = speaker.profile?.full_name || "Especialista SAPIHUM"
                const image = speaker.photo_url || speaker.profile?.avatar_url
                const specialty = speaker.specialties?.[0] || "Psicología aplicada"
                const descriptor =
                  speaker.credentials?.slice(0, 2).join(" · ") ||
                  speaker.headline ||
                  "Perfil público dentro del ecosistema SAPIHUM."

                return (
                  <Link
                    key={speaker.id}
                    href={`/speakers/${speaker.id}`}
                    className="group overflow-hidden border border-white/[0.08] bg-black transition-all duration-500 hover:border-[#f6ae02]/25"
                  >
                    <div className="relative aspect-[4/4.4] overflow-hidden bg-gradient-to-br from-black via-[#111] to-[#2b210a]">
                      {image ? (
                        <Image
                          src={image}
                          alt={name}
                          fill
                          unoptimized
                          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-serif text-6xl italic text-white/15">
                            {name.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                          {specialty}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold leading-tight text-white">
                          {name}
                        </h3>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.06] p-5">
                      <p className="text-sm leading-relaxed text-[#c0bfbc]/70">
                        {descriptor}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <section className="w-full bg-background py-24 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Principios no negociables
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              La psicología no es solo una disciplina académica: implica
              responsabilidad ética, claridad técnica y sentido humano.
            </h2>
            <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground">
              Estos principios aterrizan la manera en que SAPIHUM diseña su
              academia, comunica su propuesta y piensa la infraestructura que pone
              al servicio del profesional.
            </p>
          </div>

          <div className="space-y-4">
            {PRINCIPLES.map((principle, index) => (
              <div
                key={principle}
                className="flex gap-5 border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <div className="text-3xl font-serif text-[#f6ae02]/35">
                  0{index + 1}
                </div>
                <p className="pt-1 text-lg leading-relaxed text-white/90">
                  {principle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-t border-white/[0.06] bg-black py-28 md:py-36">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
            Siguiente paso
          </p>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Si compartes esta forma de entender la psicología, aquí hay una
            plataforma hecha para acompañar tu siguiente etapa profesional.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-light leading-relaxed text-[#c0bfbc]/65">
            Explora la academia, conoce nuestras áreas visibles de especialización
            y revisa el manifiesto que sostiene la forma en que construimos
            SAPIHUM.
          </p>

          <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row uppercase tracking-[0.1em]">
            <Link href="/especialidades" className="w-full sm:w-auto">
              <Button size="lg" className="h-14 w-full px-10 text-xs font-bold">
                Ver Especialidades
              </Button>
            </Link>
            <Link href="/manifiesto" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full px-10 text-xs font-bold"
              >
                Leer el Manifiesto
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
