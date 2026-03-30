"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    dataLayer?: Array<{
      event: string
      [key: string]: unknown
    }>;
  }
}

export default function ThankYouPage() {
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") || "suscription"
  const orderId = searchParams.get("order_id") || "N/A"
  
  const [mounted, setMounted] = useState(false)

  // Disparamos evento de GA4 ecommerce "purchase" en el clinet side
  useEffect(() => {
    setMounted(true)
    
    // Evitar que se dispare múltiples veces en desarrollo estricto
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: orderId,
          value: plan === "pro" ? 1800 : plan === "elite" ? 2800 : 950,
          currency: 'MXN',
          items: [{ 
            item_id: `${plan}_monthly`, 
            item_name: `Membresía ${plan.toUpperCase()}`, 
            price: plan === "pro" ? 1800 : plan === "elite" ? 2800 : 950 
          }]
        }
      })
    }
  }, [plan, orderId])

  if (!mounted) return null // Evitar hydration mismatch

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full bg-background relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-brand-yellow/5 dark:bg-brand-yellow/10 blur-[100px]" />
      </div>

      <div className="max-w-xl w-full px-4 py-16 text-center z-10">
        
        {/* Animated Check */}
        <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-in zoom-in duration-500">
          <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          ¡Suscripción Confirmada!
        </h1>
        
        <p className="text-lg text-muted-foreground mb-10">
          Ya eres parte de Comunidad de Psicología. Tu membresía ha sido activada y tu viaje hacia una clínica más profesional comienza ahora.
        </p>

        {/* Expectation Setting Box */}
        <div className="bg-card border rounded-2xl p-6 mb-10 text-left shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">En los próximos 5 minutos:</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-yellow dark:bg-brand-yellow/50 text-brand-yellow dark:text-brand-yellow flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <p className="font-medium">Recibirás un email con tus accesos</p>
                <p className="text-sm text-muted-foreground">Revisa tu bandeja de entrada o spam.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-yellow dark:bg-brand-yellow/50 text-brand-yellow dark:text-brand-yellow flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <p className="font-medium">La comunidad te dará la bienvenida</p>
                <p className="text-sm text-muted-foreground">Podrás presentarte con los cientos de psicólogos activos.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Único CTA Fuerte */}
        <Link href="/dashboard">
          <Button size="lg" className="w-full sm:w-auto text-base h-14 px-10 font-bold bg-gradient-to-r from-brand-yellow to-brand-brown hover:from-brand-yellow hover:to-brand-brown text-white shadow-xl shadow-brand-yellow/25">
            Configura tu Perfil → Ir al Dashboard
          </Button>
        </Link>
        
        <p className="mt-8 text-sm text-muted-foreground">
          Únete a los más de 500 psicólogos que ya están adentro.
        </p>

      </div>
    </div>
  )
}
