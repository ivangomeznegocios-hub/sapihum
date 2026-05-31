import type { OrganicLeadActionType } from './types'

export const ORGANIC_LEAD_SCORE_DELTAS: Record<OrganicLeadActionType, number> = {
    guide_view: 1,
    resource_download: 3,
    event_registration: 5,
    formation_interest: 8,
    commercial_cta: 10,
    checkout_or_purchase_intent: 15,
}

export function calculateLeadScoreDelta(action: OrganicLeadActionType): number {
    return ORGANIC_LEAD_SCORE_DELTAS[action] ?? 0
}
