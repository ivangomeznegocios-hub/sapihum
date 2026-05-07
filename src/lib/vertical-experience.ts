import type { VerticalCode } from '@/types/database'

export interface VerticalExperienceModule {
    title: string
    description: string
    href: string
}

export interface VerticalExperience {
    code: VerticalCode
    name: string
    shortName: string
    eyebrow: string
    specialties: string[]
    dashboardTitle: string
    dashboardDescription: string
    dashboardModules: VerticalExperienceModule[]
}

export const VERTICAL_EXPERIENCES: Record<VerticalCode, VerticalExperience> = {
    psicologia: {
        code: 'psicologia',
        name: 'Psicologia',
        shortName: 'Psicologia',
        eyebrow: 'SAPIHUM Psicologia',
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
    },
    ciencias_forenses: {
        code: 'ciencias_forenses',
        name: 'Ciencias Forenses',
        shortName: 'Forense',
        eyebrow: 'SAPIHUM Ciencias Forenses',
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
    },
}

export function getVerticalExperience(code: VerticalCode | null | undefined) {
    return code ? VERTICAL_EXPERIENCES[code] ?? VERTICAL_EXPERIENCES.psicologia : VERTICAL_EXPERIENCES.psicologia
}
