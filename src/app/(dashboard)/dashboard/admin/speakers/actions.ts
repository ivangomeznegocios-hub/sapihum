'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdminAction } from '@/lib/admin/guard'

export async function adminCreateSpeaker(formData: FormData) {
    try {
        await requireAdminAction()
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'No autenticado' }
    }

    const email = formData.get('email') as string
    const fullName = formData.get('fullName') as string
    const headline = formData.get('headline') as string
    const photoUrl = formData.get('photo_url') as string
    const bio = formData.get('bio') as string

    const website = formData.get('website') as string
    const linkedin = formData.get('linkedin') as string

    if (!email || !fullName) {
        return { error: 'El correo y nombre son obligatorios' }
    }

    try {
        const adminAuthClient = await createAdminClient()

        // 2. Create user with temporary password
        const { data: authUser, error: authError } = await adminAuthClient.auth.admin.createUser({
            email,
            email_confirm: true,
            password: Math.random().toString(36).slice(-8) + 'A1!', // Temporary strong password
            user_metadata: { full_name: fullName }
        })

        if (authError) {
            // Already exists?
            if (authError.message.includes('already registered')) {
                return { error: 'Ya existe un usuario con este correo electrónico en la plataforma. Por ahora, agrégalo desde Gestión de Usuarios cambiándole el rol a Ponente.' }
            }
            return { error: `Error creando usuario Auth: ${authError.message}` }
        }

        const newUserId = authUser.user.id

        // Wait a tiny bit for the profile creation trigger
        await new Promise(resolve => setTimeout(resolve, 800))

        // 3. Update profile role to 'ponente'
        const { error: profileError } = await (adminAuthClient.from('profiles') as any)
            .update({
                role: 'ponente',
                full_name: fullName,
                avatar_url: photoUrl || null
            })
            .eq('id', newUserId)

        if (profileError) {
            return { error: `Error actualizando perfil: ${profileError.message}` }
        }

        // Profile role change trigger handles creating the speaker row automatically
        await new Promise(resolve => setTimeout(resolve, 800))

        // 4. Update speaker profile with detailed data
        const credentialsRaw = formData.get('credentials') as string
        const specialtiesRaw = formData.get('specialties') as string

        const speakerUpdates: any = {
            headline: headline || null,
            bio: bio || null,
            photo_url: photoUrl || null,
            social_links: {
                website: website || undefined,
                linkedin: linkedin || undefined
            },
            is_public: true
        }

        if (credentialsRaw) speakerUpdates.credentials = credentialsRaw.split('\n').map(s => s.trim()).filter(Boolean)
        if (specialtiesRaw) speakerUpdates.specialties = specialtiesRaw.split('\n').map(s => s.trim()).filter(Boolean)

        const { error: speakerError } = await (adminAuthClient.from('speakers') as any)
            .update(speakerUpdates)
            .eq('id', newUserId)

        // If for any reason the trigger failed to create it, do an insert
        if (speakerError) {
            await (adminAuthClient.from('speakers') as any)
                .insert({ id: newUserId, ...speakerUpdates })
        }

        revalidatePath('/dashboard/speakers')
        return { success: true }
    } catch (err: any) {
        return { error: `Error inesperado: ${err.message}` }
    }
}

export async function adminUpdateSpeaker(speakerId: string, formData: FormData) {
    const supabase = await createClient()

    // 1. Verify caller is admin or the speaker themselves
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', user.id)
        .single()

    const isOwner = user.id === speakerId;
    const isAdmin = (profile as any)?.role === 'admin';

    if (!isAdmin && !isOwner) {
        return { error: 'No tienes permisos para editar este ponente' }
    }

    const fullName = formData.get('fullName') as string
    const headline = formData.get('headline') as string
    const photoUrl = formData.get('photo_url') as string
    const bio = formData.get('bio') as string

    // Social links come as pre-built JSON from the form
    const socialLinksJson = formData.get('socialLinksJson') as string
    const socialLinksEnabled = formData.get('social_links_enabled') === 'on'

    const credentialsRaw = formData.get('credentials') as string
    const specialtiesRaw = formData.get('specialties') as string
    const formationsRaw = formData.get('formations') as string

    if (!fullName) {
        return { error: 'El nombre es obligatorio' }
    }

    try {
        const adminAuthClient = await createAdminClient()

        // 2. Update profile (name, avatar)
        const { error: profileError } = await (adminAuthClient.from('profiles') as any)
            .update({
                full_name: fullName,
                avatar_url: photoUrl || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', speakerId)

        if (profileError) {
            console.error("Profile update error:", profileError);
            return { error: `Error actualizando perfil: ${profileError.message}` }
        }

        // 3. Update speaker specific details
        const speakerUpdates: any = {
            headline: headline || null,
            bio: bio || null,
            photo_url: photoUrl || null,
            social_links_enabled: socialLinksEnabled,
        }

        // Parse social links from JSON
        if (socialLinksJson) {
            try {
                speakerUpdates.social_links = JSON.parse(socialLinksJson)
            } catch {
                // Keep existing
            }
        }

        if (credentialsRaw) speakerUpdates.credentials = credentialsRaw.split('\n').map(s => s.trim()).filter(Boolean)
        else speakerUpdates.credentials = null;

        if (specialtiesRaw) speakerUpdates.specialties = specialtiesRaw.split('\n').map(s => s.trim()).filter(Boolean)
        else speakerUpdates.specialties = null;

        if (formationsRaw) speakerUpdates.formations = formationsRaw.split('\n').map(s => s.trim()).filter(Boolean)
        else speakerUpdates.formations = null;

        const { error: speakerError } = await (adminAuthClient.from('speakers') as any)
            .update(speakerUpdates)
            .eq('id', speakerId)

        if (speakerError) {
            console.error("Speaker update error:", speakerError);
            return { error: `Error actualizando ponente: ${speakerError.message}` }
        }

        revalidatePath('/dashboard/speakers')
        revalidatePath(`/dashboard/speakers/${speakerId}`)
        return { success: true }
    } catch (err: any) {
        return { error: `Error inesperado: ${err.message}` }
    }
}
