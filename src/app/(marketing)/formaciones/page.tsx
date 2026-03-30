import Link from 'next/link'
import Image from 'next/image'
import { GraduationCap, ArrowRight, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPublicFormations } from './actions'

export const metadata = {
    title: 'Formaciones Completas | SAPIHUM',
    description: 'Rutas de formación profesional integral en psicología clínica.',
}

export default async function FormationsCatalogPage() {
    const formations = await getPublicFormations()

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="bg-[#0a0a0a] text-white relative overflow-hidden py-24">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/30 via-neutral-900/10 to-transparent" />
                <div className="container relative z-10">
                    <div className="max-w-3xl space-y-6">
                        <Badge variant="outline" className="border-brand-yellow/30 text-brand-yellow gap-2 mb-4 bg-brand-yellow/10">
                            <GraduationCap className="h-4 w-4" /> Academia SAPIHUM
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                            Formaciones <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-brand-brown">Completas</span>
                        </h1>
                        <p className="text-xl text-neutral-400 md:text-2xl font-light">
                            Programas integrales que unen múltiples cursos para darte una acreditación especializada y una ventaja en tu desarrollo profesional.
                        </p>
                    </div>
                </div>
            </section>

            {/* Catalog list */}
            <section className="py-20 bg-neutral-50 relative z-10">
                <div className="container">
                    <div className="flex flex-col gap-16">
                        {formations.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">
                                <GraduationCap className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-neutral-800">Próximamente</h3>
                                <p className="text-neutral-500 mt-2">Estamos construyendo nuevos programas formativos completos.</p>
                            </div>
                        ) : (
                            formations.map((formation: any) => (
                                <div key={formation.id} className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-6 md:p-8 lg:p-12 border shadow-xl shadow-neutral-200/50 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="order-2 md:order-1 space-y-6">
                                        <div className="space-y-4">
                                            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight leading-tight group-hover:text-primary transition-colors">
                                                {formation.title}
                                            </h2>
                                            {formation.subtitle && (
                                                <p className="text-xl text-neutral-600 font-medium">{formation.subtitle}</p>
                                            )}
                                        </div>
                                        
                                        {formation.description && (
                                            <p className="text-neutral-500 line-clamp-3 leading-relaxed">
                                                {formation.description}
                                            </p>
                                        )}

                                        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                                            <Button asChild size="lg" className="w-full sm:w-auto text-base rounded-full px-8 shadow-primary/20">
                                                <Link href={`/formaciones/${formation.slug}`}>
                                                    Ver programa completo <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <div className="flex flex-col text-sm text-center sm:text-left">
                                                <span className="text-neutral-500">Inversión Bundle</span>
                                                <span className="font-bold text-xl text-neutral-900">${formation.bundle_price} MXN</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="order-1 md:order-2">
                                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 ring-1 ring-neutral-900/5">
                                            {formation.image_url ? (
                                                <Image 
                                                    src={formation.image_url} 
                                                    alt={formation.title} 
                                                    fill 
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-yellow to-white">
                                                    <PlayCircle className="h-20 w-20 text-brand-yellow" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
