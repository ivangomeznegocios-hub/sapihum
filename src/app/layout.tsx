import type { Metadata, Viewport } from 'next'
import { Manrope, Playfair_Display } from 'next/font/google'
import { Suspense } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { OneSignalSetup } from '@/components/providers/onesignal-provider'
import { AnalyticsProvider } from '@/components/providers/analytics-provider'
import { CookieConsentBanner } from '@/components/gdpr/cookie-consent-banner'
import { DataLayerProvider } from '@/components/providers/data-layer-provider'
import { brandFullName, brandName, brandShortDescription } from '@/lib/brand'
import { getAppUrl } from '@/lib/config/app-url'
import './globals.css'

const manrope = Manrope({
    variable: '--font-manrope',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
})

const playfair = Playfair_Display({
    variable: '--font-playfair',
    subsets: ['latin'],
    weight: ['400', '700'],
    style: ['normal', 'italic'],
})

export const viewport: Viewport = {
    themeColor: '#000000',
}

export const metadata: Metadata = {
    metadataBase: new URL(getAppUrl()),
    title: brandFullName,
    description: brandShortDescription,
    icons: {
        icon: [
            {
                url: '/favicon-32x32.png',
                type: 'image/png',
                sizes: '32x32',
            },
        ],
        shortcut: '/favicon-32x32.png',
    },
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
            <body className={`${manrope.variable} ${playfair.variable} antialiased`}>
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
