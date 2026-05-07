import { SAPIHUM_VERTICALS } from '@/lib/verticals'
import type { VerticalCode } from '@/types/database'

export interface VerticalExperienceAction {
    label: string
    href: string
}

export interface VerticalExperienceModule {
    title: string
    description: string
    href: string
}

export interface VerticalExperience {
    code: VerticalCode
    slug: string
    name: string
    shortName: string
    eyebrow: string
    headline: string
    description: string
    heroImage: string
    primaryAction: VerticalExperienceAction
    secondaryAction: VerticalExperienceAction
    audience: string[]
    specialties: string[]
    dashboardTitle: string
    dashboardDescription: string
    dashboardModules: VerticalExperienceModule[]
    publicModules: VerticalExperienceModule[]
}

export const VERTICAL_EXPERIENCES: Record<VerticalCode, VerticalExperience> = {
    psicologia: {
        code: 'psicologia',
        slug: SAPIHUM_VERTICALS.psicologia.slug,
        name: 'Psicologia',
        shortName: 'Psicologia',
        eyebrow: 'SAPIHUM Psicologia',
        headline: 'Formacion, comunidad y herramientas para profesionales de la psicologia.',
        description:
            'Una experiencia enfocada en salud mental, practica clinica, especialidades psicologicas, investigacion aplicada y crecimiento profesional.',
        heroImage: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1800&q=80',
        primaryAction: {
            label: 'Entrar a Psicologia',
            href: '/psicologia',
        },
        secondaryAction: {
            label: 'Ver academia',
            href: '/academia?vertical=psicologia',
        },
        audience: ['Psicologos', 'Estudiantes', 'Terapeutas', 'Docentes', 'Investigadores'],
        specialties: [
            'Psicologia clinica',
            'Neuropsicologia',
            'Psicogerontologia',
            'Psicologia educativa',
            'Psicologia organizacional',
            'Psicologia forense',
        ],
        dashboardTitle: 'Dashboard de Psicologia',
        dashboardDescription:
            'Tu espacio para eventos, formaciones, comunidad, recursos y modulos profesionales de la vertical de Psicologia.',
        dashboardModules: [
            {
                title: 'Eventos de psicologia',
                description: 'Agenda, clases, talleres, grabaciones y actividades de la comunidad psicologica.',
                href: '/dashboard/events',
            },
            {
                title: 'Formaciones',
                description: 'Rutas formativas y programas comprables de la vertical de Psicologia.',
                href: '/dashboard/events/formations',
            },
            {
                title: 'Recursos profesionales',
                description: 'Materiales, guias y biblioteca disponible segun tu nivel de acceso.',
                href: '/dashboard/resources',
            },
            {
                title: 'Consultorio profesional',
                description: 'Agenda, pacientes, documentos, tareas, canalizacion y estadisticas para niveles avanzados.',
                href: '/dashboard/patients',
            },
        ],
        publicModules: [
            {
                title: 'Academia psicologica',
                description: 'Eventos, talleres y formaciones para fortalecer criterio clinico y profesional.',
                href: '/academia?vertical=psicologia',
            },
            {
                title: 'Especialidades',
                description: 'Ramas psicologicas organizadas como tracks dentro de la vertical.',
                href: '/especialidades',
            },
            {
                title: 'Membresia',
                description: 'Beneficios, comunidad y herramientas para crecer dentro de SAPIHUM.',
                href: '/precios',
            },
        ],
    },
    ciencias_forenses: {
        code: 'ciencias_forenses',
        slug: SAPIHUM_VERTICALS.ciencias_forenses.slug,
        name: 'Ciencias Forenses',
        shortName: 'Forense',
        eyebrow: 'SAPIHUM Ciencias Forenses',
        headline: 'Formacion y comunidad para ciencias forenses, criminalistica y trabajo pericial.',
        description:
            'Una experiencia separada para perfiles forenses: diplomados, eventos, casos, materiales tecnicos y rutas de actualizacion profesional.',
        heroImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1800&q=80',
        primaryAction: {
            label: 'Entrar a Ciencias Forenses',
            href: '/ciencias-forenses',
        },
        secondaryAction: {
            label: 'Ver agenda forense',
            href: '/academia?vertical=ciencias_forenses',
        },
        audience: ['Peritos', 'Criminologos', 'Criminalistas', 'Abogados', 'Investigadores', 'Estudiantes'],
        specialties: [
            'Criminalistica',
            'Criminologia',
            'Medicina forense',
            'Psicologia forense',
            'Perfilacion criminal',
            'Investigacion pericial',
        ],
        dashboardTitle: 'Dashboard de Ciencias Forenses',
        dashboardDescription:
            'Tu espacio forense: eventos, diplomados, biblioteca tecnica, comunidad pericial y compras de esta vertical.',
        dashboardModules: [
            {
                title: 'Eventos forenses',
                description: 'Sesiones, conferencias y encuentros filtrados para Ciencias Forenses.',
                href: '/dashboard/events',
            },
            {
                title: 'Diplomados y formaciones',
                description: 'Rutas forenses y programas compartidos sin mezclarse con modulos clinicos.',
                href: '/dashboard/events/formations',
            },
            {
                title: 'Accesos y compras',
                description: 'Consulta grabaciones, compras y beneficios asignados a esta vertical.',
                href: '/dashboard/mi-acceso',
            },
            {
                title: 'Comunidad pericial',
                description: 'Ponentes, networking y recursos de actualizacion profesional forense.',
                href: '/dashboard/speakers',
            },
        ],
        publicModules: [
            {
                title: 'Academia forense',
                description: 'Eventos y diplomados para ciencias forenses, criminalistica y criminologia.',
                href: '/academia?vertical=ciencias_forenses',
            },
            {
                title: 'Eventos forenses',
                description: 'Agenda publica filtrada por la vertical de Ciencias Forenses.',
                href: '/eventos?vertical=ciencias_forenses',
            },
            {
                title: 'Formaciones forenses',
                description: 'Programas completos de actualizacion, diplomados y rutas periciales.',
                href: '/formaciones?vertical=ciencias_forenses',
            },
        ],
    },
}

export const VERTICAL_EXPERIENCE_LIST = [
    VERTICAL_EXPERIENCES.psicologia,
    VERTICAL_EXPERIENCES.ciencias_forenses,
]

export function getVerticalExperience(code: VerticalCode | null | undefined) {
    return code ? VERTICAL_EXPERIENCES[code] ?? VERTICAL_EXPERIENCES.psicologia : VERTICAL_EXPERIENCES.psicologia
}
