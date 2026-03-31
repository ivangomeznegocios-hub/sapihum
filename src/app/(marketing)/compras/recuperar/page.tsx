import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RecoveryForm } from './recovery-form'
import { formatPageTitle } from '@/lib/brand'

export const metadata = {
    title: formatPageTitle('Recuperar acceso'),
    robots: {
        index: false,
        follow: false,
    },
}

export default function PurchaseRecoveryPage() {
    return (
        <section className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid w-full gap-8 lg:grid-cols-[1.05fr,0.95fr]">
                <div className="space-y-4">
                    <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Acceso sin friccion</p>
                    <h1 className="text-4xl font-semibold tracking-tight">Recupera tus compras y registros por correo</h1>
                    <p className="max-w-2xl text-base text-muted-foreground">
                        No hace falta entrar a un dashboard complejo para consumir un evento, un curso o un contenido exclusivo. Usa tu correo
                        y te enviaremos un enlace seguro para abrir tu hub privado o tu biblioteca de accesos.
                    </p>
                </div>

                <Card className="border-border/60 shadow-xl">
                    <CardHeader>
                        <CardTitle>Recibir enlace de acceso</CardTitle>
                        <CardDescription>
                            Funciona para compras individuales, accesos por membresia y registros gratuitos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecoveryForm />
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
