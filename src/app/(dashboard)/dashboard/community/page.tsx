import { getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    CalendarDays,
    Users2,
    GraduationCap,
    Briefcase,
    Video,
    Mic2,
    BookOpen,
    Newspaper,
    Handshake,
    ArrowRight,
} from 'lucide-react'

const communityLinks = [
    {
        title: 'Eventos',
        description: 'Talleres en vivo, masterclasses y formaciones para tu crecimiento profesional',
        href: '/dashboard/events',
        icon: CalendarDays,
        color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
        title: 'Networking',
        description: 'Conecta con colegas, comparte experiencias y amplía tu red profesional',
        href: '/dashboard/events/networking',
        icon: Users2,
        color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    },
    {
        title: 'Escuela Clínica',
        description: 'Formaciones clínicas especializadas y supervisión grupal',
        href: '/dashboard/events/clinical',
        icon: GraduationCap,
        color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
        title: 'Negocios',
        description: 'Estrategias y herramientas para hacer crecer tu consulta',
        href: '/dashboard/events/business',
        icon: Briefcase,
        color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    },
    {
        title: 'Grabaciones',
        description: 'Accede a las grabaciones de todos los eventos pasados',
        href: '/dashboard/events/recordings',
        icon: Video,
        color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    },
    {
        title: 'Ponentes',
        description: 'Conoce a los expertos que comparten su conocimiento con la comunidad',
        href: '/dashboard/speakers',
        icon: Mic2,
        color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    },
    {
        title: 'Recursos',
        description: 'Material educativo, guías, plantillas y documentos de apoyo',
        href: '/dashboard/resources',
        icon: BookOpen,
        color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    },
    {
        title: 'Newsletter',
        description: 'Novedades, artículos y tendencias del mundo de la psicología',
        href: '/dashboard/newsletter',
        icon: Newspaper,
        color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    },
    {
        title: 'Convenios',
        description: 'Beneficios y descuentos exclusivos para miembros de la comunidad',
        href: '/dashboard/agreements',
        icon: Handshake,
        color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    },
]

export default async function CommunityPage() {
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Users2 className="h-8 w-8" />
                    Comunidad
                </h1>
                <p className="text-muted-foreground mt-1">
                    Explora todo lo que la comunidad tiene para ti
                </p>
            </div>

            {/* Navigation Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {communityLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="block group">
                        <Card className="h-full hover:shadow-lg transition-all hover:border-primary/30">
                            <CardHeader className="pb-3">
                                <div className={`h-11 w-11 rounded-lg ${item.color} flex items-center justify-center mb-2`}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center justify-between">
                                    {item.title}
                                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {item.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
