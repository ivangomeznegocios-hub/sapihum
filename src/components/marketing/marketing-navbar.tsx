"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const NAV_ITEMS = [
  {
    label: "Especialidades",
    children: [
      {
        label: "Psicología Clínica",
        href: "/especialidades/psicologia-clinica",
        description: "Ciencia aplicada al cuidado de la salud mental",
      },
      {
        label: "Neuropsicología",
        href: "/especialidades/neuropsicologia",
        description: "Donde la neurociencia y la clínica convergen",
      },
      {
        label: "Psicología Forense",
        href: "/especialidades/psicologia-forense",
        description: "Rigor científico al servicio de la justicia",
      },
      {
        label: "Psicología Organizacional",
        href: "/especialidades/psicologia-organizacional",
        description: "Potencia el capital humano con ciencia",
      },
      {
        label: "Psicología Infantojuvenil",
        href: "/especialidades/psicologia-infantojuvenil",
        description: "Desarrollo saludable desde la infancia",
      },
      {
        label: "Ver las 12 especialidades",
        href: "/especialidades",
        description: "Explora todas las ramas disponibles en SAPIHUM",
      },
    ],
  },
  {
    label: "Academia",
    children: [
      { label: "Próximos Encuentros", href: "/academia", description: "Talleres, formaciones y sesiones en vivo" },
      { label: "Nuestros Ponentes", href: "/speakers", description: "Directorio público de expertos y facilitadores" },
    ],
  },
  {
    label: "Recursos",
    children: [
      { label: "Blog", href: "/blog", description: "Artículos sobre psicología profesional" },
      { label: "Recursos Gratuitos", href: "/recursos", description: "Herramientas, guías y plantillas descargables" },
      { label: "Casos de Estudio", href: "/casos-de-exito", description: "Profesionales que transformaron su práctica" },
    ],
  },
  { label: "Investigación", href: "/nosotros" },
  { label: "Precios", href: "/precios" },
]

interface MarketingNavbarProps {
  isLoggedIn: boolean
}

export function MarketingNavbar({ isLoggedIn }: MarketingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black dark:bg-white">
            <span className="text-[#f6ae02] dark:text-black font-bold text-[10px] tracking-tighter">SH</span>
          </div>
          <span className="font-bold text-lg tracking-[0.15em] uppercase hidden sm:inline-block">
            SAPIHUM
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.label} className="relative group">
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-sm">
                  {item.label}
                  <svg className="h-3.5 w-3.5 ml-0.5 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute top-full left-0 pt-2 w-72">
                  <div className="rounded-sm border bg-popover p-2 shadow-xl shadow-black/5 ring-1 ring-black/5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href + child.label}
                        href={child.href}
                        data-analytics-cta
                        data-analytics-label={child.label}
                        data-analytics-surface="marketing_nav_dropdown"
                        data-analytics-funnel="landing"
                        className="flex flex-col gap-0.5 rounded-sm px-3 py-2.5 hover:bg-accent transition-colors"
                      >
                        <span className="text-sm font-semibold text-foreground">{child.label}</span>
                        <span className="text-xs text-muted-foreground leading-snug">{child.description}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                data-analytics-cta
                data-analytics-label={item.label}
                data-analytics-surface="marketing_nav"
                data-analytics-funnel="landing"
                className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-sm"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Ir al Dashboard" data-analytics-surface="marketing_nav" data-analytics-funnel="dashboard">
                Ir al Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:inline-flex">
                <Button variant="outline" size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Iniciar Sesión" data-analytics-surface="marketing_nav" data-analytics-funnel="registration">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth/register" className="hidden sm:inline-flex">
                <Button size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Comenzar" data-analytics-surface="marketing_nav" data-analytics-funnel="registration">
                  Comenzar
                </Button>
              </Link>
              <Link href="/auth/register" className="sm:hidden">
                <Button size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Unirme" data-analytics-surface="marketing_nav" data-analytics-funnel="registration">
                  Unirme
                </Button>
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Abrir menú"
          >
            <span className={`block h-0.5 w-5 bg-foreground transition-all duration-300 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-foreground transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-foreground transition-all duration-300 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? "max-h-[calc(100dvh-4rem)] border-t" : "max-h-0"}`}>
        <nav className="mx-auto max-w-7xl space-y-1 overflow-y-auto px-4 py-4 pb-6">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.label} className="space-y-1">
                <p className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </p>
                {item.children.map((child) => (
                  <Link
                    key={child.href + child.label}
                    href={child.href}
                    onClick={() => setMobileOpen(false)}
                    data-analytics-cta
                    data-analytics-label={child.label}
                    data-analytics-surface="marketing_nav_mobile"
                    data-analytics-funnel="landing"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                onClick={() => setMobileOpen(false)}
                data-analytics-cta
                data-analytics-label={item.label}
                data-analytics-surface="marketing_nav_mobile"
                data-analytics-funnel="landing"
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                {item.label}
              </Link>
            )
          )}

          {!isLoggedIn && (
            <div className="pt-3 border-t mt-3">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full mb-2 font-semibold" data-analytics-cta data-analytics-label="Iniciar Sesión" data-analytics-surface="marketing_nav_mobile" data-analytics-funnel="registration">Iniciar Sesión</Button>
              </Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full font-semibold" data-analytics-cta data-analytics-label="Comenzar" data-analytics-surface="marketing_nav_mobile" data-analytics-funnel="registration">Comenzar</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
