import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Suspense } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { OneSignalSetup } from '@/components/providers/onesignal-provider'
import { AnalyticsProvider } from '@/components/providers/analytics-provider'
import { CookieConsentBanner } from '@/components/gdpr/cookie-consent-banner'
import './globals.css'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const viewport: Viewport = {
    themeColor: '#000000',
}

export const metadata: Metadata = {
    title: 'SAPIHUM | Psicología Avanzada e Investigación Humana',
    description: 'Plataforma integral para profesionales de la psicología. Formación especializada, herramientas clínicas digitales e investigación aplicada.',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'SAPIHUM',
    },
    formatDetection: {
        telephone: false,
    },
}

import { DataLayerProvider } from '@/components/providers/data-layer-provider'

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <DataLayerProvider />
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Suspense fallback={null}>
                        <AnalyticsProvider />
                    </Suspense>
                    {children}
                    <CookieConsentBanner />
                </ThemeProvider>
                <OneSignalSetup />
            </body>
        </html>
    )
}
