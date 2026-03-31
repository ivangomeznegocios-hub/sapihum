import { getPublicCatalogDescription } from '@/lib/events/public'
import type { BlogPost } from './types'

const canonicalAssetLinks = {
  eventos: {
    label: 'Explorar eventos',
    href: '/eventos',
    kind: 'eventos' as const,
  },
  academia: {
    label: 'Ver catalogo',
    href: '/academia',
    kind: 'academia' as const,
  },
}

const blogPosts: BlogPost[] = [
  {
    slug: 'evento-como-activo-comercial',
    title: 'Por que cada evento debe vender como un activo comercial, no como una agenda',
    description:
      'Una landing canonica, un hub privado y una pieza editorial de apoyo convierten cada evento en un activo de promocion, exposicion y ventas.',
    excerpt:
      'El evento deja de ser un simple ticket cuando lo disenas como producto: la pagina vende, el blog atrae y el hub entrega acceso.',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readTime: '6 min',
    category: 'Arquitectura de producto',
    featured: true,
    tags: ['eventos', 'landing', 'SEO', 'membresias'],
    canonicalFocus: ['eventos', 'academia'],
    assetLinks: [
      canonicalAssetLinks.eventos,
      canonicalAssetLinks.academia,
    ],
    intro:
      'La mejor manera de pensar un evento no es como un calendario, sino como una pieza de negocio con vida propia: capta trafico, convierte intencion y abre la puerta a una relacion mas larga.',
    sections: [
      {
        heading: 'La pagina del activo es la vendedora',
        paragraphs: [
          'Cuando alguien llega por SEO, aliado, campana o link directo, necesita una sola verdad: que es el activo, para quien sirve, por que importa y como acceder.',
          'Por eso la landing no debe parecer una ficha vacia. Tiene que responder como una venta editorial, con contexto, promesa, prueba social y una llamada a la accion clara.',
        ],
        points: [
          'Promesa clara y especifica.',
          'A quien va dirigido.',
          'Que aprende o resuelve.',
          'CTA unico por oferta.',
        ],
      },
      {
        heading: 'El blog no compite con la landing',
        paragraphs: [
          'El blog cumple otra funcion: captar demanda, explicar el problema y posicionar la idea antes de la conversion.',
          'Cada articulo puede empujar a un evento o formacion, pero no debe intentar hacer todo en una sola pagina.',
        ],
      },
      {
        heading: 'El hub privado cierra el circuito',
        paragraphs: [
          'Una vez pagado o registrado, el usuario no deberia perderse en la plataforma. El acceso vive en un hub privado con enlace de entrada, materiales y soporte.',
          'Eso reduce friccion, mejora la experiencia y hace mucho mas facil reactivar o vender de nuevo.',
        ],
      },
    ],
    ctaLabel: 'Ver eventos',
  },
  {
    slug: 'cuando-cobrar-un-evento-y-cuando-regalarlo',
    title: 'Cuando conviene cobrar un evento y cuando usarlo como captacion',
    description:
      'Una regla practica para decidir entre evento gratuito y evento pagado segun el objetivo comercial.',
    excerpt:
      'No todo evento debe monetizarse igual. Algunos estan hechos para atraer audiencia; otros para filtrar intencion y recuperar inversion.',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readTime: '5 min',
    category: 'Estrategia comercial',
    tags: ['pricing', 'captacion', 'conversion', 'campanas'],
    canonicalFocus: ['eventos', 'academia'],
    assetLinks: [canonicalAssetLinks.eventos, canonicalAssetLinks.academia],
    intro:
      'El criterio no deberia ser solamente cuanto tiempo te toma organizar el evento. La pregunta correcta es que papel cumple dentro de la escalera de valor.',
    sections: [
      {
        heading: 'Gratis si necesitas alcance',
        paragraphs: [
          'Un evento gratuito funciona muy bien cuando quieres mover audiencia nueva, crecer lista, abrir conversacion o alimentar alianzas.',
          'En esa etapa, la conversion no ocurre por el ticket, sino por la captura de contacto y el seguimiento posterior.',
        ],
      },
      {
        heading: 'Pagado si necesitas filtro y valor percibido',
        paragraphs: [
          'Cobrar tiene sentido cuando el tema es especifico, el resultado es fuerte y existe una expectativa clara de transformacion o especializacion.',
          'Tambien ayuda a ordenar la demanda: quien paga suele estar mas cerca de consumir, asistir y volver a comprar.',
        ],
        points: [
          'Tema de alta intencion.',
          'Audiencia con problema definido.',
          'Oferta con continuidad clara.',
        ],
      },
      {
        heading: 'La continuidad como beneficio del evento',
        paragraphs: [
          'Si el evento ya demostro demanda, la continuidad del acceso puede reforzar el valor para quienes asistieron o compraron.',
          'Eso aumenta el valor percibido del evento original sin fragmentar el catalogo.',
        ],
      },
    ],
    ctaLabel: 'Ver eventos',
  },
  {
    slug: 'membresia-que-retiene-y-no-cannibaliza',
    title: 'La membresia correcta no compite con tu catalogo: lo vuelve mas rentable',
    description:
      'Como disenar beneficios, descuentos y accesos para que la membresia retenga sin reemplazar eventos o formaciones.',
    excerpt:
      'La membresia funciona mejor cuando es continuidad, no atajo: acceso preferencial, ahorro y comunidad sin borrar el valor del catalogo individual.',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readTime: '7 min',
    category: 'Membresias',
    featured: true,
    tags: ['membresia', 'retencion', 'LTV', 'beneficios'],
    canonicalFocus: ['academia', 'eventos'],
    assetLinks: [
      canonicalAssetLinks.academia,
      canonicalAssetLinks.eventos,
    ],
    intro:
      'La membresia debe resolver una pregunta simple: por que quedarse aqui cuando el usuario ya recibio valor de un evento o formacion?',
    sections: [
      {
        heading: 'No la uses como sustituto',
        paragraphs: [
          'Si la membresia intenta incluirlo todo sin limites, se vuelve un descuento permanente y termina debilitando la percepcion del catalogo.',
          'En cambio, si ofrece continuidad, beneficios y acceso preferente, eleva el valor de todo lo demas.',
        ],
      },
      {
        heading: 'Si debe crear habitos de consumo',
        paragraphs: [
          'Los mejores programas de membresia invitan a volver: nuevos eventos, nuevas formaciones y ventajas practicas.',
          'El usuario paga por seguir avanzando, no solo por "tener acceso".',
        ],
        points: [
          'Continuidad de acceso.',
          'Preventa o prioridad.',
          'Ahorro frente a compra individual.',
        ],
      },
      {
        heading: 'El catalogo conserva el margen',
        paragraphs: [
          'Si cada pieza conserva su landing y su logica de valor, puedes vender por separado, agrupar o incluir sin destruir el resto de tu arquitectura comercial.',
          'Ese equilibrio es el que hace escalable el sistema.',
        ],
      },
    ],
    ctaLabel: 'Explorar catalogo',
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
