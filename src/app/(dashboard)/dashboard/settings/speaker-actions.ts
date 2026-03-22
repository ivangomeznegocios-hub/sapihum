'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSpeakerProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const updatedData: any = {
        headline: formData.get('headline') || null,
        bio: formData.get('bio') || null,
        photo_url: formData.get('photo_url') || null,
        is_public: formData.get('is_public') === 'on',
    }

    // Parse social links from JSON (built by form with full URLs)
    const socialLinksJson = formData.get('socialLinksJson') as string
    if (socialLinksJson) {
        try {
            updatedData.social_links = JSON.parse(socialLinksJson)
        } catch {
            // Fallback: keep existing
        }
    }

    // Parse array fields
    const credentialsRaw = formData.get('credentials') as string
    if (credentialsRaw) updatedData.credentials = credentialsRaw.split('\n').map((s: string) => s.trim()).filter(Boolean)

    const formationsRaw = formData.get('formations') as string
    if (formationsRaw) updatedData.formations = formationsRaw.split('\n').map((s: string) => s.trim()).filter(Boolean)

    const specialtiesRaw = formData.get('specialties') as string
    if (specialtiesRaw) updatedData.specialties = specialtiesRaw.split('\n').map((s: string) => s.trim()).filter(Boolean)

    // Check if speaker record exists
    const { data: existing } = await (supabase.from('speakers') as any)
        .select('id')
        .eq('id', user.id)
        .single()

    if (existing) {
        const { error } = await (supabase.from('speakers') as any)
            .update(updatedData)
            .eq('id', user.id)
        if (error) return { error: error.message }
    } else {
        const { error } = await (supabase.from('speakers') as any)
            .insert({ id: user.id, ...updatedData })
        if (error) return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}
