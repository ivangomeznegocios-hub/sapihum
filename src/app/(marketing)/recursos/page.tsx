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
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Recursos y Herramientas — SAPIHUM',
  description:
    'Guías clínicas, plantillas, grabaciones y herramientas exclusivas disponibles dentro de la membresía SAPIHUM para psicólogos que quieren fortalecer su práctica.',
}

const RESOURCE_CATEGORIES = [
  {
    icon: <FileText className="w-5 h-5" />,
    label: 'Plantillas Clínicas',
    description:
      'Formatos de consentimiento informado, notas de evolución y expediente alineados a NOM-004.',
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
  return (
    <div className="flex flex-col items-center w-full">
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[60svh] flex items-center overflow-hidden bg-black">
        {/* Grid background */}
        <div className="absolute inset-0 sapihum-grid-bg opacity-20" />
        {/* Glow */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-[#f6ae02]/4 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-28 text-center">
          {/* Lock badge */}
          <div className="inline-flex items-center gap-2 rounded-sm border border-[#f6ae02]/20 bg-[#f6ae02]/5 px-4 py-1.5 text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-10">
            <Lock className="w-3 h-3" />
            Acceso exclusivo para miembros
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] text-white">
            Todo lo que necesitas para{' '}
            <span className="font-serif italic font-normal text-[#c0bfbc]">
              ejercer con más criterio
            </span>{' '}
            está adentro.
          </h1>

          <p className="mt-8 text-lg md:text-xl text-[#c0bfbc]/60 max-w-2xl mx-auto leading-relaxed font-light">
            Plantillas, protocolos, grabaciones, escalas e instrumentos clínicos.
            El catálogo completo de recursos SAPIHUM está disponible para miembros activos.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center uppercase text-xs tracking-[0.1em]">
            <Link href="/membresia">
              <Button size="lg" className="h-13 px-10 font-bold w-full sm:w-auto">
                Adquirir membresía
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/precios">
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-10 font-bold w-full sm:w-auto"
              >
                Ver planes y precios
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── QUÉ INCLUYE ─────────────────────────────────────────── */}
      <section className="w-full py-32 bg-[#030303] border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-2xl mb-20">
            <p className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-4">
              Dentro de la membresía
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
              Recursos diseñados para{' '}
              <span className="font-serif italic font-normal text-[#c0bfbc]">
                la práctica real
              </span>
            </h2>
            <div className="mt-6 h-px w-20 bg-[#7a5602]" />
          </div>

          {/* Resource grid — blurred/locked state */}
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05] border border-white/[0.05]">
              {RESOURCE_CATEGORIES.map((cat) => (
                <div
                  key={cat.label}
                  className="group relative bg-[#030303] p-8 transition-colors duration-300 hover:bg-[#0a0a0a]"
                >
                  {/* Lock overlay hint */}
                  <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Lock className="w-4 h-4 text-[#f6ae02]" />
                  </div>

                  {/* Icon */}
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center border border-white/[0.06] bg-black text-[#c0bfbc] group-hover:text-[#f6ae02] group-hover:border-[#f6ae02]/20 transition-colors duration-300">
                    {cat.icon}
                  </div>

                  <h3 className="text-sm font-bold text-white uppercase tracking-[0.08em] mb-3">
                    {cat.label}
                  </h3>
                  <p className="text-sm font-light text-[#c0bfbc]/55 leading-relaxed mb-6">
                    {cat.description}
                  </p>
                  <span className="text-[10px] font-bold text-[#f6ae02]/60 uppercase tracking-[0.15em]">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Gate overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent pointer-events-none" />

            {/* Central CTA card over overlay */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-16 z-10 pointer-events-none">
              <div className="pointer-events-auto mx-4 max-w-lg w-full border border-[#f6ae02]/20 bg-black/90 backdrop-blur-sm p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-[#f6ae02]/10 flex items-center justify-center mx-auto mb-5">
                  <Shield className="w-5 h-5 text-[#f6ae02]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  Acceso completo con membresía
                </h3>
                <p className="text-sm text-[#c0bfbc]/60 font-light leading-relaxed mb-6">
                  Todos estos recursos están disponibles desde el primer día que formas parte de SAPIHUM.
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
      <section className="w-full py-28 bg-black border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left: copy */}
            <div>
              <p className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-6">
                La membresía incluye
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight mb-8">
                No solo recursos.{' '}
                <span className="font-serif italic font-normal text-[#c0bfbc]">
                  Un ecosistema completo.
                </span>
              </h2>
              <div className="border-l border-white/[0.08] pl-8 py-2 mb-10">
                <p className="text-[#c0bfbc]/60 font-light leading-relaxed">
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

            {/* Right: pillars checklist */}
            <div className="flex flex-col gap-0">
              {MEMBERSHIP_PILLARS.map((pillar, i) => (
                <div
                  key={pillar}
                  className="flex items-center gap-5 py-5 border-b border-white/[0.06] group"
                >
                  <span className="font-serif text-lg text-[#f6ae02]/40 w-8 shrink-0">
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  <span className="text-[#c0bfbc]/70 font-light text-sm leading-relaxed group-hover:text-white transition-colors duration-300">
                    {pillar}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section className="w-full py-36 bg-[#030303] border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="absolute inset-0 bg-[#f6ae02]/3 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-6">
              Empieza hoy
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight mb-6">
              Los recursos están listos.{' '}
              <span className="font-serif italic font-normal text-[#c0bfbc]">
                Solo falta que tú estés adentro.
              </span>
            </h2>
            <p className="text-lg text-[#c0bfbc]/50 font-light leading-relaxed max-w-xl mx-auto mb-14">
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
            <p className="mt-8 text-[11px] text-[#c0bfbc]/30">
              Acceso a recursos sujeto al nivel de membresía activa.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
