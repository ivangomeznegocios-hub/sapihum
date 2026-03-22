import Link from "next/link"

const FOOTER_LINKS = {
  Especialidades: [
    { label: "Psicologia Clinica", href: "/especialidades/psicologia-clinica" },
    { label: "Forense", href: "/especialidades/psicologia-forense" },
    { label: "Infantil y Adolescentes", href: "/especialidades/psicologia-infantil" },
    { label: "Adulto Mayor", href: "/especialidades/adulto-mayor" },
    { label: "Ver todas", href: "/especialidades" },
  ],
  Recursos: [
    { label: "Blog", href: "/blog" },
    { label: "Recursos Gratuitos", href: "/recursos" },
    { label: "Casos de Exito", href: "/casos-de-exito" },
  ],
  Empresa: [
    { label: "Nosotros", href: "/nosotros" },
    { label: "Manifiesto", href: "/manifiesto" },
  ],
  Legal: [
    { label: "Terminos de Servicio", href: "/terminos" },
    { label: "Aviso de Privacidad", href: "/aviso-privacidad" },
  ],
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 md:grid-cols-5">
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white">
                CP
              </div>
              <span className="text-base font-bold tracking-tight">
                Comunidad de Psicologia
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              La plataforma todo-en-uno para psicologos que quieren crecer profesionalmente.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-semibold text-foreground">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Comunidad de Psicologia. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Hecho con amor para la comunidad de salud mental
          </p>
        </div>
      </div>
    </footer>
  )
}
