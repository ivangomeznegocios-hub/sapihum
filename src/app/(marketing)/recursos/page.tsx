import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'
import {
  FileText,
  BookOpen,
  Microscope,
  ClipboardList,
  Video,
  Wrench,
  Shield,
  ArrowRight,
  Lock,
  Bot,
} from 'lucide-react'
import { ORGANIC_CONTENT } from '@/lib/organic-leads/content'
import { buildOrganicPath } from '@/lib/organic-leads/routing'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Formatos Clínicos, Plantillas e Instrumentos | SAPIHUM',
  description:
    'Descarga formatos clínicos, plantillas de consentimiento informado, expedientes psicológicos y notas clínicas SOAP. Accede de forma gratuita o adquiere la membresía SAPIHUM.',
  alternates: {
    canonical: '/recursos',
  },
}

const RESOURCE_CATEGORIES = [
  {
    icon: <FileText className="w-5 h-5" />,
    label: 'Plantillas Clínicas',
    description:
      'Formatos de consentimiento informado, notas de evolución y expediente alineados a normativas de salud.',
    count: '12+ plantillas',
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    label: 'Guías y Protocolos',
    description:
      'Protocolos clínicos por área de especialización: evaluación, intervención y seguimiento.',
    count: '8 guías activas',
  },
  {
    icon: <Microscope className="w-5 h-5" />,
    label: 'Investigación Aplicada',
    description:
      'Artículos curados, resúmenes de evidencia y actualizaciones científicas por especialidad.',
    count: 'Actualización continua',
  },
  {
    icon: <Video className="w-5 h-5" />,
    label: 'Grabaciones de Talleres',
    description:
      'Acceso al archivo de sesiones en vivo, ponencias y mesas clínicas de la comunidad.',
    count: 'Archivo completo',
  },
  {
    icon: <ClipboardList className="w-5 h-5" />,
    label: 'Escalas e Instrumentos',
    description:
      'Instrumentos de evaluación psicológica curados y listos para uso profesional.',
    count: '20+ instrumentos',
  },
  {
    icon: <Wrench className="w-5 h-5" />,
    label: 'Herramientas de Práctica',
    description:
      'Checklists, marcos de trabajo y recursos operativos para el día a día del consultorio.',
    count: 'En expansión',
  },
]

const MEMBERSHIP_PILLARS = [
  'Acceso inmediato al catálogo completo de recursos',
  'Nuevos materiales cada mes',
  'Formación continua y eventos en vivo',
  'Comunidad profesional especializada',
  'Software clínico: agenda, expediente e IA',
  'Todo en un solo ecosistema',
]

export default function RecursosPage() {
  // Filter clinical formats and resources
  const resources = ORGANIC_CONTENT.filter(
    (item) => item.contentType === 'resource_format' || item.contentType === 'resource_scale'
  )

  return (
    <div className="flex flex-col items-center w-full">
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[60svh] flex items-center overflow-hidden bg-background">
        <div className="absolute inset-0 sapihum-grid-bg opacity-20" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-[#2563EB]/4 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-sm border border-[#2563EB]/20 bg-[#2563EB]/5 px-4 py-1.5 text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-10">
            <Lock className="w-3 h-3" />
            Recursos Clínicos para Psicólogos
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] text-foreground">
            Todo lo que necesitas para{' '}
            <span className="font-serif italic font-normal text-brand-text-muted">
              ejercer con más criterio
            </span>{' '}
            está aquí.
          </h1>

          <p className="mt-8 text-lg md:text-xl text-brand-text-muted max-w-2xl mx-auto leading-relaxed font-light">
            Plantillas de consentimiento informado, notas SOAP de sesión, expedientes y listas de control. Explora la biblioteca de formatos clínicos descargables gratuitos y la membresía premium.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center uppercase text-xs tracking-[0.1em]">
            <Link href="#descargables">
              <Button size="lg" className="h-13 px-10 font-bold w-full sm:w-auto">
                Ver formatos gratuitos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/membresia">
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-10 font-bold w-full sm:w-auto bg-card"
              >
                Obtener membresía premium
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN DINÁMICA: FORMATOS CLÍNICOS DESCARGABLES (LEAD MAGNETS) ── */}
      <section id="descargables" className="w-full py-24 bg-muted/30 border-t border-b border-brand-border scroll-mt-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <Badge variant="outline" className="gap-2 border-brand-blue/30 bg-brand-blue/10 text-brand-blue px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] mb-4">
              Formatos Clínicos Gratuitos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Desbloquea plantillas editables{' '}
              <span className="font-serif italic font-normal text-brand-text-muted">
                para tu consulta privada
              </span>
            </h2>
            <p className="text-sm text-brand-text-muted mt-3 font-light leading-relaxed">
              Consigue de forma 100% gratuita plantillas profesionales con disclaimers éticos listos para rellenar, imprimir o integrar en tus expedientes electrónicos.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((item) => {
              const path = buildOrganicPath('resourceFormats', item.slug)
              return (
                <article
                  key={item.slug}
                  className="flex flex-col h-full rounded-[28px] border bg-card p-6 shadow-sm shadow-black/5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#2563EB]/30 group"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold border-brand-border bg-background text-brand-text-muted">
                      {item.contentType.replaceAll('_', ' ')}
                    </Badge>
                    {item.specialty && (
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold border-[#2563EB]/10 bg-[#2563EB]/5 text-[#2563EB]">
                        {item.specialty.replaceAll('_', ' ')}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold leading-snug text-foreground group-hover:text-[#2563EB] transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-sm font-light leading-relaxed text-brand-text-muted">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl border bg-background/50 p-4 relative overflow-hidden group-hover:bg-background/80 transition-colors duration-300">
                    <div className="flex items-start gap-2.5">
                      <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB] opacity-80" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-text-muted">Resumen para IA</p>
                        <p className="mt-1 text-xs leading-relaxed text-brand-text-muted line-clamp-3">
                          {item.aiSummary}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-brand-border pt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-light">
                      SAPIHUM Recursos
                    </span>

                    <Link href={path} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#2563EB] group-hover:underline">
                      Desbloquear formato
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── QUÉ INCLUYE ─────────────────────────────────────────── */}
      <section className="w-full py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-20">
            <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-4">
              Dentro de la membresía premium
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Recursos premium diseñados para{' '}
              <span className="font-serif italic font-normal text-brand-text-muted">
                la práctica avanzada
              </span>
            </h2>
            <div className="mt-6 h-px w-20 bg-[#1E3A8A]" />
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-border border border-brand-border">
              {RESOURCE_CATEGORIES.map((cat) => (
                <div
                  key={cat.label}
                  className="group relative bg-background p-8 transition-colors duration-300 hover:bg-background"
                >
                  <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Lock className="w-4 h-4 text-[#2563EB]" />
                  </div>

                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center border border-brand-border bg-background text-brand-text-muted group-hover:text-[#2563EB] group-hover:border-[#2563EB]/20 transition-colors duration-300">
                    {cat.icon}
                  </div>

                  <h3 className="text-sm font-bold text-foreground uppercase tracking-[0.08em] mb-3">
                    {cat.label}
                  </h3>
                  <p className="text-sm font-light text-brand-text-muted leading-relaxed mb-6">
                    {cat.description}
                  </p>
                  <span className="text-[10px] font-bold text-[#2563EB]/60 uppercase tracking-[0.15em]">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />

            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-16 z-10 pointer-events-none">
              <div className="pointer-events-auto mx-4 max-w-lg w-full border border-[#2563EB]/20 bg-background/90 backdrop-blur-sm p-8 text-center shadow-xl">
                <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center mx-auto mb-5">
                  <Shield className="w-5 h-5 text-[#2563EB]" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">
                  Acceso completo con membresía
                </h3>
                <p className="text-sm text-brand-text-muted font-light leading-relaxed mb-6">
                  Todos estos recursos premium están disponibles desde el primer día que formas parte de SAPIHUM.
                </p>
                <Link href="/membresia">
                  <Button className="font-bold uppercase text-[10px] tracking-[0.1em] gap-2">
                    Unirme a SAPIHUM
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUÉ OBTIENES (pillars) ──────────────────────────────── */}
      <section className="w-full py-28 bg-background border-t border-brand-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-6">
                La membresía incluye
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight mb-8">
                No solo recursos.{' '}
                <span className="font-serif italic font-normal text-brand-text-muted">
                  Un ecosistema completo.
                </span>
              </h2>
              <div className="border-l border-border/[0.08] pl-8 py-2 mb-10">
                <p className="text-brand-text-muted font-light leading-relaxed">
                  La membresía SAPIHUM va más allá de un catálogo de archivos. Integra formación continua,
                  comunidad profesional y software clínico en una sola experiencia.
                </p>
              </div>
              <Link href="/membresia">
                <Button
                  variant="outline"
                  className="gap-2 font-bold uppercase text-[10px] tracking-[0.1em]"
                >
                  Ver todo lo que incluye
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-col gap-0">
              {MEMBERSHIP_PILLARS.map((pillar, i) => (
                <div
                  key={pillar}
                  className="flex items-center gap-5 py-5 border-b border-brand-border group"
                >
                  <span className="font-serif text-lg text-[#2563EB]/40 w-8 shrink-0">
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  <span className="text-brand-text-muted font-light text-sm leading-relaxed group-hover:text-foreground transition-colors duration-300">
                    {pillar}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section className="w-full py-36 bg-background border-t border-brand-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="absolute inset-0 bg-[#2563EB]/3 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-6">
              Empieza hoy
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
              Los recursos están listos.{' '}
              <span className="font-serif italic font-normal text-brand-text-muted">
                Solo falta que tú estés adentro.
              </span>
            </h2>
            <p className="text-lg text-brand-text-muted font-light leading-relaxed max-w-xl mx-auto mb-14">
              Únete a la membresía y accede de inmediato a plantillas, guías, grabaciones y todo lo que necesitas para ejercer con más estructura y respaldo.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center uppercase text-xs tracking-[0.1em]">
              <Link href="/membresia">
                <Button size="lg" className="h-14 px-12 font-bold w-full sm:w-auto">
                  Adquirir membresía
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/precios">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-12 font-bold w-full sm:w-auto"
                >
                  Ver precios
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-[11px] text-brand-text-disabled">
              Acceso a recursos sujeto al nivel de membresía activa.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
