'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNewsletter(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'No autorizado' }

    const title = formData.get('title') as string
    const summary = formData.get('summary') as string
    const contentHtml = formData.get('contentHtml') as string
    const coverImageUrl = formData.get('coverImageUrl') as string
    const month = parseInt(formData.get('month') as string)
    const year = parseInt(formData.get('year') as string)
    const isActive = formData.get('isActive') === 'true'

    if (!title || !contentHtml || !month || !year) {
        return { error: 'Faltan campos requeridos' }
    }

    // If setting as active, deactivate all others first
    if (isActive) {
        await (supabase.from('newsletters') as any)
            .update({ is_active: false })
            .eq('is_active', true)
    }

    const { error } = await (supabase.from('newsletters') as any)
        .insert({
            title,
            summary: summary || null,
            content_html: contentHtml,
            cover_image_url: coverImageUrl || null,
            month,
            year,
            is_active: isActive,
            published_at: isActive ? new Date().toISOString() : null,
            created_by: user.id,
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/newsletter')
    revalidatePath('/dashboard/admin/newsletters')
    return { success: true }
}

export async function updateNewsletter(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'No autorizado' }

    const title = formData.get('title') as string
    const summary = formData.get('summary') as string
    const contentHtml = formData.get('contentHtml') as string
    const coverImageUrl = formData.get('coverImageUrl') as string
    const month = parseInt(formData.get('month') as string)
    const year = parseInt(formData.get('year') as string)

    const updates: Record<string, any> = {}
    if (title) updates.title = title
    if (summary !== undefined) updates.summary = summary || null
    if (contentHtml) updates.content_html = contentHtml
    if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl || null
    if (month) updates.month = month
    if (year) updates.year = year

    const { error } = await (supabase.from('newsletters') as any)
        .update(updates).eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/newsletter')
    revalidatePath('/dashboard/admin/newsletters')
    return { success: true }
}

export async function toggleNewsletterActive(id: string, isActive: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'No autorizado' }

    // If activating, deactivate all first
    if (isActive) {
        await (supabase.from('newsletters') as any)
            .update({ is_active: false })
            .eq('is_active', true)
    }

    const { error } = await (supabase.from('newsletters') as any)
        .update({
            is_active: isActive,
            published_at: isActive ? new Date().toISOString() : null,
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/newsletter')
    revalidatePath('/dashboard/admin/newsletters')
    return { success: true }
}

export async function deleteNewsletter(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'No autorizado' }

    const { error } = await (supabase.from('newsletters') as any)
        .delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/newsletter')
    revalidatePath('/dashboard/admin/newsletters')
    return { success: true }
}
