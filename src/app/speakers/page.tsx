import Link from 'next/link'
import Image from 'next/image'
import { getPublicSpeakers } from '@/lib/supabase/queries/speakers'
import { formatPageTitle } from '@/lib/brand'
import { getSpeakerHeadline, getSpeakerImage, getSpeakerName } from '@/lib/speakers/display'
import { Mic2 } from 'lucide-react'

export const metadata = {
    title: formatPageTitle('Nuestros Ponentes'),
    description: 'Conoce a los expertos y ponentes que imparten nuestros eventos y talleres.',
}

export default async function PonentesPage() {
    const speakers = await getPublicSpeakers()

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            {/* ── Editorial header ── */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                <div className="max-w-2xl">
                    <p className="text-[10px] font-bold text-[#f6ae02] uppercase tracking-[0.2em] mb-4">
                        Cuerpo Docente
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                        Nuestros{" "}
                        <span className="font-serif italic font-normal text-[#c0bfbc]">
                            ponentes
                        </span>
                    </h1>
                    <div className="h-px w-20 bg-[#7a5602] mt-6" />
                </div>
                <p className="text-[#c0bfbc]/50 max-w-sm text-sm font-light leading-relaxed">
                    Conoce a los expertos que imparten nuestros eventos, talleres y cursos especializados.
                </p>
            </div>

            {speakers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] mb-6">
                        <Mic2 className="h-8 w-8 text-[#c0bfbc]/30" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No hay ponentes públicos</h3>
                    <p className="mx-auto max-w-sm text-sm text-[#c0bfbc]/50 font-light">
                        Aún no se han configurado perfiles públicos de ponentes en la plataforma.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {speakers.map((speaker: any) => {
                        const speakerName = getSpeakerName(speaker)
                        const speakerHeadline = getSpeakerHeadline(speaker)
                        const speakerImage = getSpeakerImage(speaker)
                        const mainSpecialty = speaker.specialties?.[0]
                        const credential = speaker.credentials?.length > 0
                            ? speaker.credentials.join(' · ')
                            : speakerHeadline

                        return (
                            <Link
                                key={speaker.id}
                                href={`/speakers/${speaker.id}`}
                                className="group cursor-pointer block"
                            >
                                {/* Portrait photo with duotone warm hover */}
                                <div className="relative w-full aspect-[4/5] bg-[#0a0a0a] mb-5 overflow-hidden rounded-md border border-white/[0.06]">
                                    {speakerImage ? (
                                        <Image
                                            src={speakerImage}
                                            alt={speakerName}
                                            fill
                                            unoptimized
                                            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                            className="object-cover transition-all duration-700 opacity-70 group-hover:opacity-100 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
                                            <span className="text-[#c0bfbc]/30 font-serif italic text-6xl">
                                                {speakerName.split(' ')[1]?.[0] || speakerName[0]}
                                            </span>
                                        </div>
                                    )}

                                    {/* Warm duotone tint on hover */}
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-[0.55] transition-opacity duration-500 pointer-events-none"
                                        style={{ backgroundColor: '#f6ae02', mixBlendMode: 'multiply' as any }}
                                    />

                                    {/* Bottom gradient for text legibility */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                                    {/* Name and specialty overlay */}
                                    <div className="absolute bottom-4 left-4 right-4 z-10">
                                        {mainSpecialty && (
                                            <p className="text-[10px] text-[#f6ae02] uppercase tracking-widest font-semibold mb-1 group-hover:text-[#fcd34d] transition-colors">
                                                {mainSpecialty}
                                            </p>
                                        )}
                                        <h3 className="text-xl font-serif text-white leading-tight">{speakerName}</h3>
                                    </div>
                                </div>

                                {/* Credentials below the photo */}
                                <div className="pl-4 border-l border-white/[0.08] group-hover:border-[#f6ae02] transition-colors duration-300">
                                    {credential && (
                                        <p className="text-xs text-[#c0bfbc] mb-2 leading-relaxed line-clamp-2">
                                            {credential}
                                        </p>
                                    )}
                                    {speakerHeadline && speaker.credentials?.length > 0 && (
                                        <p className="text-[10px] uppercase tracking-wide text-[#c0bfbc]/50">
                                            {speakerHeadline}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
