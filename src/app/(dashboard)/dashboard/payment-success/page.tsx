import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
    return (
        <div className="max-w-lg mx-auto mt-12 space-y-6">
            <Card className="border-green-200 dark:border-green-900 text-center">
                <CardHeader className="pb-2">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">¡Pago exitoso!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Tu pago ha sido procesado correctamente. Tu cuenta será actualizada en unos momentos.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        <Clock className="h-4 w-4" />
                        <span>Los cambios pueden tardar unos segundos en reflejarse</span>
                    </div>
                    <Button asChild className="w-full">
                        <Link href="/dashboard/subscription">
                            Ir a mi membresía
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
