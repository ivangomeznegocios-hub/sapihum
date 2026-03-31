import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { Suspense } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { OneSignalSetup } from '@/components/providers/onesignal-provider'
import { AnalyticsProvider } from '@/components/providers/analytics-provider'
import { CookieConsentBanner } from '@/components/gdpr/cookie-consent-banner'
import { DataLayerProvider } from '@/components/providers/data-layer-provider'
import { brandFullName, brandName, brandShortDescription } from '@/lib/brand'
import './globals.css'

const manrope = Manrope({
    variable: '--font-manrope',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
})

export const viewport: Viewport = {
    themeColor: '#000000',
}

export const metadata: Metadata = {
    title: brandFullName,
    description: brandShortDescription,
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: brandName,
    },
    formatDetection: {
        telephone: false,
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={`${manrope.variable} antialiased`}>
                <DataLayerProvider />
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
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
