export interface EventDetailStateInput {
    canEditEvent: boolean
    canUseActiveVertical: boolean
    canDiscoverEvent: boolean
    isRegistered: boolean
    hasAccessEntitlement: boolean
}

export type EventDetailState = 'available' | 'restricted'

export function resolveEventDetailState(input: EventDetailStateInput): EventDetailState {
    if (input.canEditEvent) return 'available'
    if (!input.canUseActiveVertical) return 'restricted'
    if (input.canDiscoverEvent || input.isRegistered || input.hasAccessEntitlement) return 'available'
    return 'restricted'
}
