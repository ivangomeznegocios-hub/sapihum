import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { Button } from '@/components/ui/button'

export function EntryGate() {
  return (
    <main className="min-h-screen bg-brand-background text-brand-text selection:bg-brand-blue selection:text-white flex flex-col">
      
      {/* Header */}
      <header className="flex-none px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <BrandWordmark className="text-base" />
        <Link href="/auth/login">
          <Button variant="outline" size="sm" className="font-semibold rounded-full px-6 border-brand-border hover:bg-brand-surface shadow-sm text-xs h-9">
            Iniciar sesión
          </Button>
        </Link>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 pb-16">
        
        {/* Intro */}
        <section className="flex flex-col items-center text-center mb-10 sm:mb-16">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-brand-blue mb-4">
            SAPIHUM
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-tight text-brand-text-strong tracking-tight max-w-2xl">
            ¿A qué área quieres entrar?
          </h1>
          <p className="mt-4 text-sm text-brand-text-muted max-w-md">
            Selecciona tu disciplina para entrar a tu espacio profesional.
          </p>
        </section>

        {/* Choices - Full Image Background with Elegant Typography */}
        <section className="flex flex-col md:flex-row gap-4 sm:gap-6 w-full max-w-5xl mx-auto">
          
          {/* Psicología Card */}
          {/* PERF: priority=true — this is the LCP image on mobile (above the fold) */}
          <Link 
            href="/psicologia" 
            className="group relative flex-1 flex flex-col overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-sm transition-all duration-500 hover:shadow-brand-luxury hover:-translate-y-2 min-h-[220px] sm:min-h-[460px]"
          >
            {/* Full Background Image via next/image (enables preload, WebP, srcset) */}
            <Image
              src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=1300&q=90"
              alt=""
              fill
              priority
              quality={75}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="absolute inset-0 object-cover object-center transition-transform duration-[800ms] ease-out group-hover:scale-105"
            />
            {/* Base darkening overlay + strong gradients for maximum text legibility */}
            <div className="absolute inset-0 bg-black/30 transition-opacity duration-500 group-hover:bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-transparent to-black/90" />
            
            {/* Content Container */}
            <div className="relative flex flex-col h-full p-6 sm:p-8 z-10 text-white">
              
              {/* Top Aligned Text */}
              <div>
                <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                  Salud Mental
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white drop-shadow-sm">
                  Psicología
                </h2>
                {/* Hidden on mobile for a cleaner look */}
                <p className="mt-3 hidden sm:block text-sm text-white/90 leading-relaxed max-w-sm drop-shadow-sm">
                  Clínica, psicoterapia, neuropsicología y desarrollo profesional integral.
                </p>
              </div>

              {/* Bottom Aligned Action Button (mt-auto pushes it down) */}
              <div className="mt-auto flex items-center justify-between sm:justify-start gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90 transition-colors duration-300 sm:order-2 group-hover:text-white">
                  Entrar
                </span>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-all duration-300 group-hover:bg-brand-blue group-hover:border-brand-blue group-hover:translate-x-1 border border-white/10 sm:order-1 shadow-sm">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

            </div>
          </Link>

          {/* Ciencias Forenses Card */}
          {/* PERF: no priority — second card, below fold on mobile, loads after LCP */}
          <Link 
            href="/ciencias-forenses" 
            className="group relative flex-1 flex flex-col overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-sm transition-all duration-500 hover:shadow-brand-luxury hover:-translate-y-2 min-h-[220px] sm:min-h-[460px]"
          >
            {/* Full Background Image via next/image (enables WebP, srcset) */}
            <Image
              src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1300&q=90"
              alt=""
              fill
              quality={75}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="absolute inset-0 object-cover object-center transition-transform duration-[800ms] ease-out group-hover:scale-105"
            />
            {/* Base darkening overlay + strong gradients for maximum text legibility */}
            <div className="absolute inset-0 bg-black/30 transition-opacity duration-500 group-hover:bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-transparent to-black/90" />
            
            {/* Content Container */}
            <div className="relative flex flex-col h-full p-6 sm:p-8 z-10 text-white">
              
              {/* Top Aligned Text */}
              <div>
                <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                  Justicia e Investigación
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white drop-shadow-sm">
                  Forenses
                </h2>
                {/* Hidden on mobile for a cleaner look */}
                <p className="mt-3 hidden sm:block text-sm text-white/90 leading-relaxed max-w-sm drop-shadow-sm">
                  Psicología criminal, perfilación, criminalística y ciencias aplicadas.
                </p>
              </div>

              {/* Bottom Aligned Action Button (mt-auto pushes it down) */}
              <div className="mt-auto flex items-center justify-between sm:justify-start gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90 transition-colors duration-300 sm:order-2 group-hover:text-white">
                  Entrar
                </span>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-all duration-300 group-hover:bg-brand-blue group-hover:border-brand-blue group-hover:translate-x-1 border border-white/10 sm:order-1 shadow-sm">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

            </div>
          </Link>

        </section>
      </div>
    </main>
  )
}
