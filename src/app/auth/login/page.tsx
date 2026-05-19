import { Suspense } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from './login-form'

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <Card className="border-border/50 shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Cargando...</CardTitle>
                    </CardHeader>
                </Card>
            }
        >
            <LoginForm />
        </Suspense>
    )
}
