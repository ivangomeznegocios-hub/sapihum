type ResolveEventEditorAccessParams = {
  userId: string
  role?: string | null
  createdBy?: string | null
  isAssignedSpeaker?: boolean
}

export function canManageAnyEvent(role?: string | null) {
  return role === 'admin' || role === 'event_manager'
}

export function canCreateEvent(role?: string | null) {
  return canManageAnyEvent(role) || role === 'ponente'
}

export function canPublishEvent(role?: string | null) {
  return canManageAnyEvent(role)
}

export function canDeleteEvent(role?: string | null) {
  return role === 'admin'
}

export function canViewEventStats(role?: string | null) {
  return role === 'admin'
}

export function canManageEventAdvancedSettings(role?: string | null) {
  return canManageAnyEvent(role)
}

export function canManageOwnedEvent({
  userId,
  role,
  createdBy,
}: Pick<ResolveEventEditorAccessParams, 'userId' | 'role' | 'createdBy'>) {
  return canManageAnyEvent(role) || createdBy === userId
}

export function resolveEventEditorAccess({
  userId,
  role,
  createdBy,
  isAssignedSpeaker = false,
}: ResolveEventEditorAccessParams) {
  const canManageEvent = canManageOwnedEvent({ userId, role, createdBy })
  const canEditEvent = canManageEvent || isAssignedSpeaker

  return {
    canManageEvent,
    canEditEvent,
    isAssignedSpeaker,
  }
}

type GetEventEditorAccessForUserParams = {
  supabase: any
  eventId: string
  userId: string
  role?: string | null
  createdBy?: string | null
}

export async function getEventEditorAccessForUser({
  supabase,
  eventId,
  userId,
  role,
  createdBy,
}: GetEventEditorAccessForUserParams) {
  const baseAccess = resolveEventEditorAccess({
    userId,
    role,
    createdBy,
  })

  if (baseAccess.canManageEvent) {
    return baseAccess
  }

  const { data, error } = await (supabase
    .from('event_speakers') as any)
    .select('speaker_id')
    .eq('event_id', eventId)
    .eq('speaker_id', userId)
    .limit(1)

  if (error) {
    console.error('[EventPermissions] Error checking speaker assignment:', error)
    return baseAccess
  }

  return resolveEventEditorAccess({
    userId,
    role,
    createdBy,
    isAssignedSpeaker: Boolean(data?.[0]?.speaker_id),
  })
}
