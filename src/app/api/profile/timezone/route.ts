import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isValidIanaTimezone(value: string): boolean {
    try {
        Intl.DateTimeFormat('es-MX', { timeZone: value }).format(new Date())
        return true
    } catch {
        return false
    }
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { timezone } = await request.json()

    if (!timezone || typeof timezone !== 'string') {
        return NextResponse.json({ error: 'Zona horaria invalida' }, { status: 400 })
    }

    const normalizedTimezone = timezone.trim()
    if (!normalizedTimezone || !isValidIanaTimezone(normalizedTimezone)) {
        return NextResponse.json({ error: 'Zona horaria invalida' }, { status: 400 })
    }

    const { error } = await (supabase
        .from('profiles') as any)
        .update({ timezone: normalizedTimezone })
        .eq('id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
