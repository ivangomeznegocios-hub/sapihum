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
    title: 'Comunidad Psicología App',
    description: 'Plataforma exclusiva para miembros de la comunidad de psicología',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Comunidad Psicología App',
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
