import Link from "next/link"
import type { ComponentPropsWithoutRef } from "react"
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react"
import { BrandWordmark } from "@/components/brand/brand-wordmark"
import { getMarketingSpecializations } from "@/lib/specializations"

const SPECIALIZATION_LINKS = getMarketingSpecializations().map((spec) => ({
  label: spec.name,
  href: `/especialidades/${spec.slug}`,
}))

const FOOTER_LINKS = {
  Especialidades: SPECIALIZATION_LINKS,
  Academia: [
    { label: "Pr\u00F3ximos Encuentros", href: "/academia" },
    { label: "Formaciones", href: "/formaciones" },
    { label: "Ponentes", href: "/speakers" },
  ],
  Recursos: [
    { label: "Blog", href: "/blog" },
    { label: "Recursos Gratuitos", href: "/recursos" },
    { label: "Casos de Estudio", href: "/casos-de-exito" },
  ],
  Empresa: [
    { label: "Nosotros", href: "/nosotros" },
    { label: "Manifiesto", href: "/manifiesto" },
    { label: "Investigaci\u00F3n", href: "/nosotros" },
    { label: "Comunidad", href: "/comunidad" },
  ],
  Legal: [
    { label: "T\u00E9rminos de Servicio", href: "/terminos" },
    { label: "Aviso de Privacidad", href: "/aviso-privacidad" },
  ],
}

function TikTokIcon(props: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.35V2h-3.12v12.18a2.67 2.67 0 0 1-5.34 0 2.67 2.67 0 0 1 2.67-2.67c.28 0 .55.04.81.12V8.46a5.8 5.8 0 0 0-.81-.06A5.79 5.79 0 0 0 4.24 14.2 5.79 5.79 0 0 0 10.03 20a5.79 5.79 0 0 0 5.79-5.79V8.03a7.9 7.9 0 0 0 4.64 1.5V6.69h-.87Z" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  {
    label: "YouTube",
    href: null,
    icon: Youtube,
  },
  {
    label: "Instagram",
    href: null,
    icon: Instagram,
  },
  {
    label: "Facebook",
    href: null,
    icon: Facebook,
  },
  {
    label: "TikTok",
    href: null,
    icon: TikTokIcon,
  },
  {
    label: "LinkedIn",
    href: null,
    icon: Linkedin,
  },
] as const

export function MarketingFooter() {
  return (
    <footer className="border-t bg-[#030303]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 md:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center" aria-label="SAPIHUM">
              <BrandWordmark className="text-sm sm:text-base lg:tracking-[0.16em]" />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {"Psicolog\u00EDa Avanzada e Investigaci\u00F3n Humana. La plataforma integral para profesionales de la psicolog\u00EDa."}
            </p>
            <div className="mt-6">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
                {"S\u00EDguenos"}
              </p>
              <div className="flex flex-wrap gap-3">
                {SOCIAL_LINKS.map((socialLink) => {
                  const Icon = socialLink.icon

                  const iconClassName =
                    "h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                  const buttonClassName =
                    "group inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:border-[#f6ae02]/50 hover:bg-[#f6ae02]/10 hover:text-[#f6ae02]"

                  return (
                    socialLink.href ? (
                      <Link
                        key={socialLink.label}
                        href={socialLink.href}
                        aria-label={socialLink.label}
                        className={buttonClassName}
                      >
                        <Icon className={iconClassName} strokeWidth={1.9} />
                      </Link>
                    ) : (
                      <span
                        key={socialLink.label}
                        aria-label={`${socialLink.label} pendiente de enlace`}
                        className={`${buttonClassName} cursor-default`}
                        title={`${socialLink.label} pendiente de enlace`}
                      >
                        <Icon className={iconClassName} strokeWidth={1.9} />
                      </span>
                    )
                  )
                })}
              </div>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-[#f6ae02]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t py-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs font-semibold text-muted-foreground">
            &copy; {new Date().getFullYear()} SAPIHUM &mdash; {"Psicolog\u00EDa Avanzada e Investigaci\u00F3n Humana. Todos los derechos reservados."}
          </p>
          <p className="text-xs text-muted-foreground">
            Construido con ciencia para la comunidad de salud mental
          </p>
        </div>
      </div>
    </footer>
  )
}
