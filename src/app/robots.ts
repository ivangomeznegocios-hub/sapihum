import { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/config/app-url'

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl()

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/academia/',
        '/especialidades/',
        '/eventos/',
        '/formaciones/',
        '/blog/',
        '/recursos/',
        '/guias/',
        '/recursos/formatos/',
        '/recursos/escalas/',
        '/autores/',
        '/libros/',
        '/enfoques/',
        '/herramientas/',
        '/psicologos/',
      ],
      disallow: [
        '/auth/',
        '/dashboard/',
        '/lp/',
        '/legal/',
        '/gracias',
        '/api/',
        '/eventos/*/embed',
        '/compras/',
      ],
    },
    host: appUrl,
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
