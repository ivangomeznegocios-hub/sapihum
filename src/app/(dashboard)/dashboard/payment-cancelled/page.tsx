import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelledPage() {
    return (
        <div className="max-w-lg mx-auto mt-12 space-y-6">
            <Card className="border-yellow-200 dark:border-yellow-900 text-center">
                <CardHeader className="pb-2">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <CardTitle className="text-2xl">Pago cancelado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        El proceso de pago fue cancelado. No se realizó ningún cargo. Puedes intentar de nuevo cuando gustes.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/subscription">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a membresía
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
