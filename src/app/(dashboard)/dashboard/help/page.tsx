import { Card, CardContent } from '@/components/ui/card'
import { HelpCircle, Lock } from 'lucide-react'

export default function HelpPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                    <HelpCircle className="h-8 w-8" />
                    Ayuda
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Soporte para tu cuenta y uso del dashboard.
                </p>
            </div>

            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold">Próximamente</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Estamos preparando este espacio de soporte. Estará disponible para todos los niveles de acceso.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
