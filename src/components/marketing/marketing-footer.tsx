import Link from "next/link"

const FOOTER_LINKS = {
  Especialidades: [
    { label: "PsicologÃ­a ClÃ­nica", href: "/especialidades/psicologia-clinica" },
    { label: "NeuropsicologÃ­a", href: "/especialidades/neuropsicologia" },
    { label: "PsicologÃ­a Forense", href: "/especialidades/psicologia-forense" },
    { label: "Organizacional", href: "/especialidades/psicologia-organizacional" },
    { label: "Infantojuvenil", href: "/especialidades/psicologia-infantojuvenil" },
    { label: "Ver las 12", href: "/especialidades" },
  ],
  Academia: [
    { label: "PrÃ³ximos Encuentros", href: "/academia" },
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
    { label: "InvestigaciÃ³n", href: "/nosotros" },
    { label: "Comunidad", href: "/comunidad" },
  ],
  Legal: [
    { label: "TÃ©rminos de Servicio", href: "/terminos" },
    { label: "Aviso de Privacidad", href: "/aviso-privacidad" },
  ],
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-[#030303]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 md:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black dark:bg-white">
                <span className="text-[#f6ae02] dark:text-black font-bold text-[10px] tracking-tighter">SH</span>
              </div>
              <span className="text-base font-bold tracking-[0.15em] uppercase">
                SAPIHUM
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              PsicologÃ­a Avanzada e InvestigaciÃ³n Humana. La plataforma integral para profesionales de la psicologÃ­a.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 text-[10px] font-bold text-foreground uppercase tracking-[0.2em]">{category}</h4>
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
          <p className="text-xs text-muted-foreground font-semibold">
            &copy; {new Date().getFullYear()} SAPIHUM â€” PsicologÃ­a Avanzada e InvestigaciÃ³n Humana. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Construido con ciencia para la comunidad de salud mental
          </p>
        </div>
      </div>
    </footer>
  )
}
