'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

interface AnalyticsChartsProps {
    appointmentsByMonth: { name: string; total: number }[]
}

export function AnalyticsCharts({ appointmentsByMonth }: AnalyticsChartsProps) {
    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Citas por Mes</CardTitle>
                <CardDescription>
                    Tendencia de sesiones programadas
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {appointmentsByMonth.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={appointmentsByMonth}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))',
                                    }}
                                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Bar
                                    dataKey="total"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                    name="Citas"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No hay datos suficientes para mostrar el gráfico
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
