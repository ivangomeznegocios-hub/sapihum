'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAgreement(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'No autorizado' }

    const companyName = formData.get('companyName') as string
    const companyLogoUrl = formData.get('companyLogoUrl') as string
    const description = formData.get('description') as string
    const benefitsRaw = formData.get('benefits') as string
    const discountCode = formData.get('discountCode') as string
    const discountPercentage = parseFloat(formData.get('discountPercentage') as string) || null
    const websiteUrl = formData.get('websiteUrl') as string
    const contactEmail = formData.get('contactEmail') as string
    const category = formData.get('category') as string || 'general'

    if (!companyName || !description) {
        return { error: 'Nombre de empresa y descripción son requeridos' }
    }

    let benefits: string[] = []
    try {
        benefits = benefitsRaw ? JSON.parse(benefitsRaw) : []
    } catch {
        benefits = benefitsRaw ? benefitsRaw.split('\n').filter(Boolean) : []
    }

    const { error } = await (supabase.from('exclusive_agreements') as any)
        .insert({
            company_name: companyName,
            company_logo_url: companyLogoUrl || null,
            description,
            benefits,
            discount_code: discountCode || null,
            discount_percentage: discountPercentage,
            website_url: websiteUrl || null,
            contact_email: contactEmail || null,
            category,
            is_active: true,
            created_by: user.id,
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/agreements')
    revalidatePath('/dashboard/admin/agreements')
    return { success: true }
}

export async function updateAgreement(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'No autorizado' }

    const companyName = formData.get('companyName') as string
    const companyLogoUrl = formData.get('companyLogoUrl') as string
    const description = formData.get('description') as string
    const benefitsRaw = formData.get('benefits') as string
    const discountCode = formData.get('discountCode') as string
    const discountPercentage = parseFloat(formData.get('discountPercentage') as string) || null
    const websiteUrl = formData.get('websiteUrl') as string
    const contactEmail = formData.get('contactEmail') as string
    const category = formData.get('category') as string

    const updates: Record<string, any> = {}
    if (companyName) updates.company_name = companyName
    if (companyLogoUrl !== undefined) updates.company_logo_url = companyLogoUrl || null
    if (description) updates.description = description
    if (benefitsRaw !== undefined) {
        try {
            updates.benefits = JSON.parse(benefitsRaw)
        } catch {
            updates.benefits = benefitsRaw ? benefitsRaw.split('\n').filter(Boolean) : []
        }
    }
    if (discountCode !== undefined) updates.discount_code = discountCode || null
    if (discountPercentage !== undefined) updates.discount_percentage = discountPercentage
    if (websiteUrl !== undefined) updates.website_url = websiteUrl || null
    if (contactEmail !== undefined) updates.contact_email = contactEmail || null
    if (category) updates.category = category

    const { error } = await (supabase.from('exclusive_agreements') as any)
        .update(updates).eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/agreements')
    revalidatePath('/dashboard/admin/agreements')
    return { success: true }
}

export async function toggleAgreementActive(id: string, isActive: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'No autorizado' }

    const { error } = await (supabase.from('exclusive_agreements') as any)
        .update({ is_active: isActive }).eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/agreements')
    revalidatePath('/dashboard/admin/agreements')
    return { success: true }
}

export async function deleteAgreement(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'No autorizado' }

    const { error } = await (supabase.from('exclusive_agreements') as any)
        .delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/agreements')
    revalidatePath('/dashboard/admin/agreements')
    return { success: true }
}
