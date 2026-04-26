import type { NextConfig } from 'next'
import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
    reactStrictMode: false,
    turbopack: {}, // Workaround for serwist + turbopack build blocking
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'encrypted-tbn0.gstatic.com',
            },
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: '**.wixstatic.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/especialidades/psicologia-infantil',
                destination: '/especialidades/psicologia-infantojuvenil',
                permanent: true,
            },
            {
                source: '/especialidades/adulto-mayor',
                destination: '/especialidades/psicogerontologia',
                permanent: true,
            },
        ]
    },
    async headers() {
        const securityHeaders = [
            {
                key: 'X-Content-Type-Options',
                value: 'nosniff',
            },
            {
                key: 'X-Frame-Options',
                value: 'DENY',
            },
            {
                key: 'Referrer-Policy',
                value: 'strict-origin-when-cross-origin',
            },
            {
                key: 'Permissions-Policy',
                value: 'camera=(self), microphone=(self), geolocation=(), payment=(self), usb=()',
            },
        ]

        if (process.env.NODE_ENV === 'production') {
            securityHeaders.push({
                key: 'Strict-Transport-Security',
                value: 'max-age=63072000; includeSubDomains; preload',
            })
        }

        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
        ]
    },
}

export default withSerwist(nextConfig)
