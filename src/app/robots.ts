import { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/config/app-url'

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl()

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
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
