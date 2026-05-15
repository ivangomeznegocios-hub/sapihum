import type { Metadata, Viewport } from 'next'
import { Manrope, Playfair_Display } from 'next/font/google'
import { TrackingBootstrap } from '@/components/providers/tracking-bootstrap'
import { DeferredClientRuntime } from '@/components/providers/deferred-client-runtime'
import { ServiceWorkerRegister } from '@/components/providers/service-worker-register'
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
    themeColor: '#FAFAF9',
}

export const metadata: Metadata = {
    metadataBase: new URL(getAppUrl()),
    title: brandFullName,
    description: brandShortDescription,
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined,
    },
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
            {/* PERF: Preconnect to external image hosts used for critical above-the-fold images */}
            <head>
                <link rel="preconnect" href="https://images.unsplash.com" />
                <link rel="dns-prefetch" href="https://images.unsplash.com" />
                <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://res.cloudinary.com" />
            </head>
            <body className={`${manrope.variable} ${playfair.variable} antialiased`}>
                <TrackingBootstrap />
                {children}
                <ServiceWorkerRegister />
                <DeferredClientRuntime />
            </body>
        </html>
    )
}
