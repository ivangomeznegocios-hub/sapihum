'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsChartsProps {
    appointmentsByMonth: { name: string; total: number }[]
}

const AnalyticsCharts = dynamic(
    () => import('./analytics-charts').then((mod) => mod.AnalyticsCharts),
    {
        ssr: false,
        loading: () => (
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>Citas por Mes</CardTitle>
                    <CardDescription>
                        Tendencia de sesiones programadas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full flex items-center justify-center bg-muted/10 animate-pulse rounded-md border border-dashed border-muted">
                        <span className="text-muted-foreground/50 text-sm">Cargando gráfico...</span>
                    </div>
                </CardContent>
            </Card>
        ),
    }
)

export function DynamicAnalyticsCharts(props: AnalyticsChartsProps) {
    return <AnalyticsCharts {...props} />
}
