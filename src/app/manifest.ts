import { MetadataRoute } from 'next'
import { brandName, brandShortDescription } from '@/lib/brand'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: brandName,
        short_name: brandName,
        description: brandShortDescription,
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    }
}
