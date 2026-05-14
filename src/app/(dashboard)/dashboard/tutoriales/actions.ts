'use server'

import { revalidatePath } from 'next/cache'
import { requireActionRoles } from '@/lib/access/role-guard'
import { createClient } from '@/lib/supabase/server'
import { extractYouTubeVideoId } from '@/lib/youtube'

export type TutorialActionState = {
    error?: string
    success?: string
}

const TUTORIALS_PATH = '/dashboard/tutoriales'

function parseTutorialPayload(formData: FormData) {
    const title = String(formData.get('title') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const youtubeUrl = String(formData.get('youtube_url') ?? '').trim()
    const sortOrderRaw = String(formData.get('sort_order') ?? '0').trim()
    const sortOrder = Number.parseInt(sortOrderRaw || '0', 10)
    const youtubeVideoId = extractYouTubeVideoId(youtubeUrl)

    if (!title) {
        return { error: 'El titulo es obligatorio.' }
    }

    if (!youtubeVideoId) {
        return { error: 'Ingresa un enlace valido de YouTube.' }
    }

    if (Number.isNaN(sortOrder)) {
        return { error: 'El orden debe ser un numero.' }
    }

    return {
        data: {
            title,
            description: description || null,
            youtube_url: youtubeUrl,
            youtube_video_id: youtubeVideoId,
            sort_order: sortOrder,
            is_active: formData.get('is_active') === 'on',
        },
    }
}

export async function createSpeakerTutorial(
    _previousState: TutorialActionState,
    formData: FormData
): Promise<TutorialActionState> {
    let viewer: Awaited<ReturnType<typeof requireActionRoles>>

    try {
        viewer = await requireActionRoles(['admin'], 'Solo los administradores pueden crear tutoriales')
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'No autorizado' }
    }

    const payload = parseTutorialPayload(formData)
    if ('error' in payload) return { error: payload.error }

    const supabase = await createClient()
    const { error } = await (supabase
        .from('speaker_tutorials') as any)
        .insert({
            ...payload.data,
            created_by: viewer.user.id,
        })

    if (error) {
        console.error('Error creating speaker tutorial:', error)
        return { error: 'No se pudo crear el tutorial.' }
    }

    revalidatePath(TUTORIALS_PATH)
    return { success: 'Tutorial creado.' }
}

export async function updateSpeakerTutorial(
    tutorialId: string,
    _previousState: TutorialActionState,
    formData: FormData
): Promise<TutorialActionState> {
    try {
        await requireActionRoles(['admin'], 'Solo los administradores pueden editar tutoriales')
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'No autorizado' }
    }

    const payload = parseTutorialPayload(formData)
    if ('error' in payload) return { error: payload.error }

    const supabase = await createClient()
    const { error } = await (supabase
        .from('speaker_tutorials') as any)
        .update(payload.data)
        .eq('id', tutorialId)

    if (error) {
        console.error('Error updating speaker tutorial:', error)
        return { error: 'No se pudo actualizar el tutorial.' }
    }

    revalidatePath(TUTORIALS_PATH)
    return { success: 'Tutorial actualizado.' }
}

export async function deleteSpeakerTutorial(tutorialId: string, formData: FormData): Promise<void> {
    void formData

    try {
        await requireActionRoles(['admin'], 'Solo los administradores pueden eliminar tutoriales')
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'No autorizado')
    }

    const supabase = await createClient()
    const { error } = await (supabase
        .from('speaker_tutorials') as any)
        .delete()
        .eq('id', tutorialId)

    if (error) {
        console.error('Error deleting speaker tutorial:', error)
        throw new Error('No se pudo eliminar el tutorial.')
    }

    revalidatePath(TUTORIALS_PATH)
}
