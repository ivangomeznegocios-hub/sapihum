import Link from "next/link"
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

export function MarketingFooter() {
  return (
    <footer className="border-t bg-[#030303]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 md:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center" aria-label="SAPIHUM">
              <BrandWordmark className="text-sm text-[#f6ae02] sm:text-base lg:tracking-[0.16em]" />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {"Psicolog\u00EDa Avanzada e Investigaci\u00F3n Humana. La plataforma integral para profesionales de la psicolog\u00EDa."}
            </p>
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
