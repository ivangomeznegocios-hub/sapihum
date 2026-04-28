import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Download, Search, Beaker } from 'lucide-react'
import { sapihumStudyBlogPost, sapihumStudyPdfHref } from '@/lib/research/sapihum-study'

export const metadata = {
  title: 'Investigación | SAPIHUM — Psicología Avanzada e Investigación Humana',
  description: 'Publicaciones institucionales, estudios aplicados y alianzas de investigación en SAPIHUM.',
}

export default function InvestigacionPage() {
  const study = sapihumStudyBlogPost

  return (
    <div className="flex flex-col items-center flex-1 w-full bg-background relative">
      {/* HERO SECTION */}
      <section className="relative flex w-full overflow-hidden bg-black min-h-[90vh] md:min-h-screen items-center">
        <div className="absolute inset-0 sapihum-grid-bg opacity-25" />
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#f6ae02]/8 blur-[160px] pointer-events-none" />

        <div className="absolute right-0 bottom-0 w-full md:w-2/3 h-[70vh] opacity-30 mix-blend-screen pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2874&auto=format&fit=crop"
            alt="Abstract geometry"
            fill
            className="object-cover object-right-bottom mask-image-gradient-to-l"
            priority
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background pointer-events-none" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="max-w-4xl pt-20">
            <div className="sapihum-fade-up mb-8 inline-flex items-center gap-2 rounded-sm border border-[#f6ae02]/20 bg-[#f6ae02]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Centro de Investigación SAPIHUM
            </div>

            <h1
              className="sapihum-fade-up text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
              style={{ animationDelay: '0.1s' }}
            >
              Generando ciencia,{' '}
              <br className="hidden md:block" />
              <span className="font-serif font-normal italic text-[#c0bfbc]">
                transformando la práctica.
              </span>
            </h1>

            <p
              className="sapihum-fade-up mt-8 max-w-2xl text-lg font-light leading-relaxed text-[#c0bfbc]/80 md:text-xl lg:text-2xl"
              style={{ animationDelay: '0.2s' }}
            >
              Nuestra comunidad no solo consume evidencia empírica, la crea. Desarrollamos
              investigación rigurosa, papers y aportes en pro de la evolución de la psicología en
              habla hispana.
            </p>

            <div
              className="sapihum-fade-up mt-12 flex flex-col gap-4 sm:flex-row uppercase tracking-[0.1em]"
              style={{ animationDelay: '0.3s' }}
            >
              <Link href="#publicacion" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 w-full px-10 text-xs font-bold gap-2">
                  Publicación destacada
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="publicacion" className="w-full border-y border-white/[0.06] bg-[#050505] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                Publicación destacada
              </p>
              <h2 className="max-w-4xl text-3xl font-bold tracking-tight text-white md:text-5xl leading-tight">
                {study.title}
              </h2>
              <p className="max-w-3xl text-lg font-light leading-relaxed text-[#c0bfbc]/80">
                {study.description}
              </p>
              <p className="max-w-3xl text-base leading-7 text-[#c0bfbc]/65">
                {study.excerpt}
              </p>

              <div className="flex flex-wrap gap-3 uppercase tracking-[0.1em]">
                <Link href={`/blog/${study.slug}`} className="w-full sm:w-auto">
                  <Button size="lg" className="h-14 w-full gap-2 px-8 text-xs font-bold">
                    <BookOpen className="h-4 w-4" />
                    Leer en el blog
                  </Button>
                </Link>
                <Link href={sapihumStudyPdfHref} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 w-full gap-2 px-8 text-xs font-bold"
                  >
                    <Download className="h-4 w-4" />
                    Descargar PDF
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {study.stats?.slice(0, 4).map((metric) => (
                  <div
                    key={`${metric.label}-${metric.value}`}
                    className="border border-white/[0.08] bg-white/[0.03] p-4"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c0bfbc]/60">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      {metric.value}
                    </p>
                    {metric.note ? (
                      <p className="mt-2 text-sm leading-6 text-[#c0bfbc]/70">{metric.note}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-white/[0.08] bg-white/[0.03] p-6 md:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                  Resumen metodológico
                </p>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="border-b border-white/[0.08] pb-4">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c0bfbc]/60">
                      Muestra
                    </dt>
                    <dd className="mt-2 text-base text-white">312 profesionales de la psicología</dd>
                  </div>
                  <div className="border-b border-white/[0.08] pb-4">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c0bfbc]/60">
                      Diseño
                    </dt>
                    <dd className="mt-2 text-base text-white">Cuantitativo, transversal y retrospectivo</dd>
                  </div>
                  <div className="border-b border-white/[0.08] pb-4">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c0bfbc]/60">
                      Instrumento
                    </dt>
                    <dd className="mt-2 text-base text-white">Cuestionario digital de 45 ítems</dd>
                  </div>
                  <div className="border-b border-white/[0.08] pb-4">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c0bfbc]/60">
                      Levantamiento
                    </dt>
                    <dd className="mt-2 text-base text-white">Primer trimestre de 2026</dd>
                  </div>
                </dl>
                <p className="mt-5 text-sm leading-6 text-[#c0bfbc]/65">
                  La evidencia es exploratoria y descriptiva. Nos sirve para leer tendencias del gremio,
                  no para representar de forma probabilística a toda la profesión.
                </p>
              </div>

              <div className="border border-white/[0.08] bg-[#0a0a0a] p-6 md:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                  Alcance editorial
                </p>
                <p className="mt-4 text-sm leading-6 text-[#c0bfbc]/70">
                  Este estudio abre una línea de conversación sobre límites, honorarios, telepsicología,
                  bienestar profesional e inteligencia artificial aplicada a la práctica.
                </p>
                <ul className="mt-5 grid gap-3 text-sm text-white">
                  <li className="border-b border-white/[0.08] pb-3">Más demanda no siempre significa mejores condiciones.</li>
                  <li className="border-b border-white/[0.08] pb-3">La modalidad híbrida ya es estándar operativo.</li>
                  <li className="border-b border-white/[0.08] pb-3">La confidencialidad sigue marcando el uso de IA.</li>
                  <li className="pb-1">Sostener al paciente exige sostener al profesional.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {study.figures?.map((figure) => (
              <figure
                key={figure.src}
                className="overflow-hidden border border-white/[0.08] bg-white/[0.03] transition-colors hover:border-[#f6ae02]/25"
              >
                <div className="relative aspect-[16/9] bg-white">
                  <Image
                    src={figure.src}
                    alt={figure.alt}
                    fill
                    sizes="(min-width: 1280px) 28rem, (min-width: 768px) 45vw, 100vw"
                    className="object-contain p-2"
                  />
                </div>
                <figcaption className="border-t border-white/[0.08] px-4 py-4 text-sm leading-6 text-[#c0bfbc]/75">
                  {figure.caption}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-12 border border-white/[0.08] bg-white/[0.03] p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Lectura institucional
            </p>
            <p className="mt-4 max-w-4xl text-2xl font-semibold leading-tight text-white md:text-3xl">
              Sostener mejor al paciente requiere sostener mejor al profesional.
            </p>
            <p className="mt-4 max-w-4xl text-lg font-light leading-relaxed text-[#c0bfbc]/70">
              La investigación deja una señal clara: la demanda crece, la práctica se digitaliza y el
              modelo híbrido se consolida, pero eso no resuelve por sí mismo la brecha entre agenda,
              ingreso, límites y bienestar. La conversación que viene no es solo sobre tecnología o
              captación de pacientes, sino sobre sostenibilidad profesional.
            </p>
          </div>
        </div>
      </section>

      {/* PROYECTOS EN DESARROLLO Y FUTUROS */}
      <section id="proyectos" className="w-full bg-background py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Líneas de Avance
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl leading-tight">
              Proyectos en desarrollo <br className="hidden sm:block" />
              <span className="font-serif italic text-muted-foreground font-normal">
                y futuros aportes a la comunidad.
              </span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground">
              No nos limitamos a nichos cerrados. Investigamos, recopilamos datos y publicamos papers
              científicos para elevar el estándar operativo, ético y técnico de la psicología clínica en
              general.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-start">
            <div className="relative h-[600px] w-full group">
              <div className="absolute inset-0 border border-white/[0.08] bg-white/[0.02] p-4 transition-colors duration-500 group-hover:border-[#f6ae02]/20">
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=2938&auto=format&fit=crop"
                    alt="Estructuras de investigación abstracta"
                    fill
                    className="object-cover opacity-60 transition-transform duration-[10s] group-hover:scale-110 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02] mb-2">
                      Visión Aplicada
                    </p>
                    <p className="text-xl font-serif italic text-white/90">
                      &ldquo;La tecnología y los datos como medio para observar patrones con validez ecológica y rigor clínico.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 pt-8">
              <div className="group relative border-b border-white/[0.08] pb-8 transition-colors hover:border-[#f6ae02]/30">
                <div className="flex gap-6 items-start">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-[#f6ae02]/20 bg-[#f6ae02]/5 text-[#f6ae02]">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-3">Red de Práctica Basada en Evidencia</h3>
                    <p className="text-[#c0bfbc]/70 leading-relaxed font-light">
                      Agrupamos a clínicos independientes bajo una misma taxonomía para generar evidencia
                      empírica real, anonimizada desde su origen y en estricto cumplimiento legal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group relative border-b border-white/[0.08] pb-8 transition-colors hover:border-[#f6ae02]/30">
                <div className="flex gap-6 items-start">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-[#f6ae02]/20 bg-[#f6ae02]/5 text-[#f6ae02]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-3">Papers y Publicaciones Científicas</h3>
                    <p className="text-[#c0bfbc]/70 leading-relaxed font-light">
                      Desarrollo de artículos académicos, guías clínicas y adaptaciones de herramientas para
                      la población hispanohablante, buscando cerrar la brecha entre la academia y la trinchera
                      del consultorio.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group relative pb-8">
                <div className="flex gap-6 items-start">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-[#f6ae02]/20 bg-[#f6ae02]/5 text-[#f6ae02]">
                    <Beaker className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-3">Aportes a la Comunidad de Salud</h3>
                    <p className="text-[#c0bfbc]/70 leading-relaxed font-light">
                      Investigación orientada a mejorar la calidad de vida de los pacientes y el bienestar del
                      profesional de la salud mental, compartiendo hallazgos y recursos en pro de la psicología
                      global.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-t border-white/[0.06] bg-[#030303] py-28 md:py-36 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-[#f6ae02]/5 blur-[120px] pointer-events-none" />

        <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8 items-center relative z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
              Colaboración Institucional
            </p>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
              Alianzas para expandir <br />
              <span className="font-serif italic text-[#c0bfbc]">el conocimiento.</span>
            </h2>
            <p className="mt-6 text-lg font-light leading-relaxed text-[#c0bfbc]/65">
              Colaboramos activamente con universidades, centros de investigación y hospitales. Ofrecemos
              infraestructura técnica y acceso a datos anonimizados para investigadores y organizaciones
              que compartan nuestra rigurosidad ética.
            </p>
            <p className="mt-4 text-base font-medium text-white/80">
              Escríbenos directamente o envíanos un mensaje; nuestro comité revisará tu propuesta.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/[0.08] p-8 md:p-12 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            <form className="relative flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c0bfbc]/70 ml-1">
                    Nombre o Institución
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Ej. López / Universidad X"
                    className="w-full bg-black/50 border-b border-white/[0.1] px-4 py-4 text-white placeholder:text-white/20 focus:border-[#f6ae02]/50 focus:outline-none focus:ring-0 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c0bfbc]/70 ml-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@institucion.edu"
                    className="w-full bg-black/50 border-b border-white/[0.1] px-4 py-4 text-white placeholder:text-white/20 focus:border-[#f6ae02]/50 focus:outline-none focus:ring-0 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c0bfbc]/70 ml-1">
                  Breve descripción de la propuesta o línea de interés
                </label>
                <textarea
                  rows={4}
                  placeholder="Nos interesa colaborar en un proyecto sobre..."
                  className="w-full bg-black/50 border-b border-white/[0.1] px-4 py-4 text-white placeholder:text-white/20 focus:border-[#f6ae02]/50 focus:outline-none focus:ring-0 transition-colors resize-none"
                />
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  size="lg"
                  className="w-full h-14 uppercase tracking-[0.1em] text-xs font-bold transition-all hover:shadow-[0_0_20px_rgba(246,174,2,0.15)]"
                >
                  Enviar Propuesta
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-white/[0.06] text-center">
              <p className="text-xs text-[#c0bfbc]/50 font-light">
                También puedes escribirnos directamente a:{' '}
                <a href="mailto:investigacion@sapihum.com" className="text-[#f6ae02] hover:underline">
                  investigacion@sapihum.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
