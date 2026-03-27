import { getCommercialAccessContext } from '@/lib/access/commercial'
import type { InternalModuleViewer } from '@/lib/access/internal-modules'
import { createClient, getUserProfile } from '@/lib/supabase/server'

export async function getCurrentInternalAccessContext() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        return {
            supabase,
            profile: null,
            commercialAccess: null,
            viewer: null,
        }
    }

    const commercialAccess = await getCommercialAccessContext({
        supabase,
        userId: profile.id,
        profile,
    })

    const viewer: InternalModuleViewer = {
        role: profile.role,
        membershipLevel: commercialAccess?.membershipLevel ?? 0,
        membershipSpecializationCode: (profile as any)?.membership_specialization_code ?? null,
    }

    return {
        supabase,
        profile,
        commercialAccess,
        viewer,
    }
}
