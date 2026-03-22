import { Metadata } from "next"
import { PrivacySettingsTab } from "@/components/settings/privacy-settings-tab"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Privacidad y Datos | Configuración",
    description: "Gestiona tu privacidad, descarga tus datos y ejerce tus derechos ARCO.",
}

export default function PrivacyPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
                <Link 
                    href="/dashboard/settings" 
                    className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-muted"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                        Privacidad y Datos
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Controles avanzados para gestionar tus derechos sobre tu información personal
                    </p>
                </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-4 mb-8">
                <h3 className="font-medium text-orange-800 dark:text-orange-300 flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    Área Restringida
                </h3>
                <p className="text-sm text-orange-700/90 dark:text-orange-400">
                    Las acciones en esta página tienen impacto directo sobre tus datos personales y cuenta. Por favor, procede con cautela y lee cuidadosamente las advertencias antes de ejecutar cualquier acción.
                </p>
            </div>

            <PrivacySettingsTab />
        </div>
    )
}
