import type { GrowthCampaignType } from '@/types/database'

export const campaignTypeLabels: Record<GrowthCampaignType, string> = {
    referral_boost: 'Impulso de referidos',
    milestone: 'Meta o hito',
    promo: 'Promocion',
    challenge: 'Reto',
    custom: 'Personalizada',
}

export const campaignTypeDescriptions: Record<GrowthCampaignType, string> = {
    referral_boost: 'Premia cuando una persona invita a otra y esa invitacion genera resultado.',
    milestone: 'Se activa al llegar a una meta concreta, como un numero de invitaciones o ventas.',
    promo: 'Sirve para ofertas temporales o campanas especiales con fecha limite.',
    challenge: 'Se usa para retos con objetivo claro, reglas visibles y duracion definida.',
    custom: 'Permite configurar reglas especiales que no encajan en las opciones anteriores.',
}

export const rewardTypeLabels: Record<string, string> = {
    credit: 'Credito',
    discount: 'Descuento',
    unlock: 'Acceso desbloqueado',
    commission: 'Comision',
    cash_bonus: 'Bono en efectivo',
    membership_benefit: 'Beneficio de membresia',
    custom: 'Beneficio personalizado',
}

export const triggerLabels: Record<string, string> = {
    signup: 'Registro confirmado',
    profile_completed: 'Perfil completo',
    subscription: 'Primera suscripcion',
    first_purchase: 'Primera compra',
    event_purchase: 'Compra de evento',
}

export const roleLabels: Record<string, string> = {
    psychologist: 'Psicologos',
    ponente: 'Ponentes',
    patient: 'Pacientes',
    admin: 'Administradores',
}

export const professionalProgramLabel = 'Invitacion profesional'
