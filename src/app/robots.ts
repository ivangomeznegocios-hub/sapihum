import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/blog/',
        '/recursos/',
        '/casos-de-exito/'
      ],
      disallow: [
        '/auth/',
        '/dashboard/',
        '/lp/',
        '/legal/',
        '/gracias',
        '/api/' // Added to prevent indexing of internal APIs
      ],
    },
    sitemap: 'https://puntoempresarios.club/sitemap.xml',
  }
}
