import { getPublicCatalogDescription } from '@/lib/events/public'
import type { BlogPost } from './types'

const canonicalAssetLinks = {
  eventos: {
    label: 'Explorar eventos',
    href: '/eventos',
    kind: 'eventos' as const,
  },
  cursos: {
    label: 'Ver cursos',
    href: '/cursos',
    kind: 'cursos' as const,
  },
  grabaciones: {
    label: 'Ver grabaciones',
    href: '/grabaciones',
    kind: 'grabaciones' as const,
  },
}

const blogPosts: BlogPost[] = [
  {
    slug: 'evento-como-activo-comercial',
    title: 'Por qué cada evento debe vender como un activo comercial, no como una agenda',
    description:
      'Una landing canónica, un hub privado y una pieza editorial de apoyo convierten cada evento en un activo de promoción, exposición y ventas.',
    excerpt:
      'El evento deja de ser un simple ticket cuando lo diseñas como producto: la página vende, el blog atrae y el hub entrega acceso.',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readTime: '6 min',
    category: 'Arquitectura de producto',
    featured: true,
    tags: ['eventos', 'landing', 'SEO', 'membresias'],
    canonicalFocus: ['eventos', 'cursos', 'grabaciones'],
    assetLinks: [
      canonicalAssetLinks.eventos,
      canonicalAssetLinks.cursos,
      canonicalAssetLinks.grabaciones,
    ],
    intro:
      'La mejor manera de pensar un evento no es como un calendario, sino como una pieza de negocio con vida propia: capta tráfico, convierte intención y abre la puerta a una relación más larga.',
    sections: [
      {
        heading: 'La página del activo es la vendedora',
        paragraphs: [
          'Cuando alguien llega por SEO, aliado, campaña o link directo, necesita una sola verdad: qué es el activo, para quién sirve, por qué importa y cómo acceder.',
          'Por eso la landing no debe parecer una ficha vacía. Tiene que responder como una venta editorial, con contexto, promesa, prueba social y una llamada a la acción clara.',
        ],
        points: [
          'Promesa clara y específica.',
          'A quién va dirigido.',
          'Qué aprende o resuelve.',
          'CTA único por oferta.',
        ],
      },
      {
        heading: 'El blog no compite con la landing',
        paragraphs: [
          'El blog cumple otra función: captar demanda, explicar el problema y posicionar la idea antes de la conversión.',
          'Cada artículo puede empujar a un evento, curso o grabación, pero no debe intentar hacer todo en una sola página.',
        ],
      },
      {
        heading: 'El hub privado cierra el circuito',
        paragraphs: [
          'Una vez pagado o registrado, el usuario no debería perderse en la plataforma. El acceso vive en un hub privado con join link, materiales, replay y soporte.',
          'Eso reduce fricción, mejora la experiencia y hace mucho más fácil reactivar o vender de nuevo.',
        ],
      },
    ],
    ctaLabel: 'Ver eventos',
  },
  {
    slug: 'cuando-cobrar-un-evento-y-cuando-regalarlo',
    title: 'Cuándo conviene cobrar un evento y cuándo usarlo como captación',
    description:
      'Una regla práctica para decidir entre evento gratuito, evento pagado y contenido on-demand según el objetivo comercial.',
    excerpt:
      'No todo evento debe monetizarse igual. Algunos están hechos para atraer audiencia; otros para filtrar intención y recuperar inversión.',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readTime: '5 min',
    category: 'Estrategia comercial',
    tags: ['pricing', 'captacion', 'conversión', 'campañas'],
    canonicalFocus: ['eventos', 'grabaciones'],
    assetLinks: [canonicalAssetLinks.eventos, canonicalAssetLinks.grabaciones],
    intro:
      'El criterio no debería ser solamente cuánto tiempo te toma organizar el evento. La pregunta correcta es qué papel cumple dentro de la escalera de valor.',
    sections: [
      {
        heading: 'Gratis si necesitas alcance',
        paragraphs: [
          'Un evento gratuito funciona muy bien cuando quieres mover audiencia nueva, crecer lista, abrir conversación o alimentar alianzas.',
          'En esa etapa, la conversión no ocurre por el ticket, sino por la captura de contacto y el seguimiento posterior.',
        ],
      },
      {
        heading: 'Pagado si necesitas filtro y valor percibido',
        paragraphs: [
          'Cobrar tiene sentido cuando el tema es específico, el resultado es fuerte y existe una expectativa clara de transformación o especialización.',
          'También ayuda a ordenar la demanda: quien paga suele estar más cerca de consumir, asistir y volver a comprar.',
        ],
        points: [
          'Tema de alta intención.',
          'Audiencia con problema definido.',
          'Oferta con replay o continuidad.',
        ],
      },
      {
        heading: 'La grabación extiende el valor',
        paragraphs: [
          'Si el evento ya demostró demanda, la grabación puede vivir como producto independiente o como beneficio de membresía.',
          'Eso convierte una sola producción en varias oportunidades de venta.',
        ],
      },
    ],
    ctaLabel: 'Ver grabaciones',
  },
  {
    slug: 'membresia-que-retiene-y-no-cannibaliza',
    title: 'La membresía correcta no compite con tu catálogo: lo vuelve más rentable',
    description:
      'Cómo diseñar beneficios, descuentos y accesos para que la membresía retenga sin reemplazar eventos, cursos o grabaciones.',
    excerpt:
      'La membresía funciona mejor cuando es continuidad, no atajo: acceso preferencial, ahorro y comunidad sin borrar el valor del catálogo individual.',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readTime: '7 min',
    category: 'Membresías',
    featured: true,
    tags: ['membresia', 'retencion', 'LTV', 'beneficios'],
    canonicalFocus: ['cursos', 'grabaciones', 'eventos'],
    assetLinks: [
      canonicalAssetLinks.cursos,
      canonicalAssetLinks.grabaciones,
      canonicalAssetLinks.eventos,
    ],
    intro:
      'La membresía debe resolver una pregunta simple: ¿por qué quedarse aquí cuando el usuario ya recibió valor de un evento o curso?',
    sections: [
      {
        heading: 'No la uses como sustituto',
        paragraphs: [
          'Si la membresía intenta incluirlo todo sin límites, se vuelve un descuento permanente y termina debilitando la percepción del catálogo.',
          'En cambio, si ofrece continuidad, beneficios y acceso preferente, eleva el valor de todo lo demás.',
        ],
      },
      {
        heading: 'Sí debe crear hábitos de consumo',
        paragraphs: [
          'Los mejores programas de membresía invitan a volver: nuevos eventos, nuevas grabaciones, nuevos cursos o ventajas prácticas.',
          'El usuario paga por seguir avanzando, no solo por “tener acceso”.',
        ],
        points: [
          'Replays extendidos.',
          'Preventa o prioridad.',
          'Ahorro frente a compra individual.',
        ],
      },
      {
        heading: 'El catálogo conserva el margen',
        paragraphs: [
          'Si cada pieza conserva su landing y su lógica de valor, puedes vender por separado, agrupar o incluir sin destruir el resto de tu arquitectura comercial.',
          'Ese equilibrio es el que hace escalable el sistema.',
        ],
      },
    ],
    ctaLabel: 'Explorar cursos',
  },
]

export function getBlogPosts() {
  return [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug) ?? null
}

export function getFeaturedBlogPosts() {
  return getBlogPosts().filter((post) => post.featured)
}

export function getBlogCategoryDescription(category: string) {
  const post = blogPosts.find((entry) => entry.category === category)
  return post?.description ?? getPublicCatalogDescription('eventos')
}
