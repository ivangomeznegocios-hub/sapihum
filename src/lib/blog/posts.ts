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
    title: 'Por que un evento bien presentado genera mas interes y mejores resultados',
    description:
      'Una presentacion clara, contenido util y un acceso sencillo ayudan a que cada evento conecte mejor con las personas adecuadas.',
    excerpt:
      'Cuando un evento comunica bien su valor, resulta mas facil despertar interes, orientar la decision y ofrecer una mejor experiencia.',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readTime: '6 min',
    category: 'Eventos y crecimiento profesional',
    featured: true,
    tags: ['eventos', 'formacion', 'experiencia', 'membresia'],
    canonicalFocus: ['eventos', 'academia'],
    assetLinks: [
      canonicalAssetLinks.eventos,
      canonicalAssetLinks.academia,
    ],
    intro:
      'Un evento no solo se valora por la fecha en la que ocurre, sino por la forma en que presenta su propuesta, acompana al participante y deja abierta la puerta para seguir creciendo.',
    sections: [
      {
        heading: 'Una presentacion clara inspira confianza',
        paragraphs: [
          'Cuando una persona conoce un evento, necesita entender rapidamente de que trata, para quien esta pensado y que puede esperar de la experiencia.',
          'Una pagina clara, bien estructurada y facil de recorrer transmite profesionalismo y facilita la decision de participar.',
        ],
        points: [
          'Beneficio principal bien explicado.',
          'Perfil de asistente definido.',
          'Aprendizajes o resultados esperados.',
          'Proceso de acceso simple.',
        ],
      },
      {
        heading: 'El contenido previo ayuda a tomar una mejor decision',
        paragraphs: [
          'Los articulos, guias o recomendaciones relacionadas permiten ampliar el contexto y responder dudas antes de inscribirse.',
          'Eso hace que la invitacion al evento se sienta mas util, mas cercana y mejor alineada con la necesidad real del lector.',
        ],
      },
      {
        heading: 'Una experiencia de acceso simple mejora el recuerdo del evento',
        paragraphs: [
          'Despues del registro, lo ideal es que todo sea intuitivo: acceso, materiales y seguimiento en un mismo lugar.',
          'Cuando la experiencia es ordenada y amable, aumenta la satisfaccion y tambien la probabilidad de volver a participar.',
        ],
      },
    ],
    ctaLabel: 'Explorar eventos',
  },
  {
    slug: 'cuando-cobrar-un-evento-y-cuando-regalarlo',
    title: 'Cuando conviene cobrar un evento y cuando ofrecerlo sin costo',
    description:
      'Una guia practica para elegir entre evento gratuito y evento pagado segun la experiencia que quieres ofrecer y el objetivo que buscas.',
    excerpt:
      'No todos los eventos cumplen la misma funcion: algunos ayudan a abrir comunidad y otros funcionan mejor como experiencias de mayor profundidad.',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readTime: '5 min',
    category: 'Eventos y decisiones de acceso',
    tags: ['eventos', 'comunidad', 'valor', 'acceso'],
    canonicalFocus: ['eventos', 'academia'],
    assetLinks: [canonicalAssetLinks.eventos, canonicalAssetLinks.academia],
    intro:
      'La decision no depende solo del esfuerzo de organizacion. Tambien importa el momento de tu comunidad, el objetivo del encuentro y el tipo de experiencia que deseas construir.',
    sections: [
      {
        heading: 'Sin costo cuando quieres abrir la puerta',
        paragraphs: [
          'Un evento sin costo puede ser ideal para acercar personas nuevas, presentar un tema relevante y generar una primera experiencia positiva con tu propuesta.',
          'Suele funcionar muy bien cuando el objetivo es dar visibilidad, construir confianza y facilitar que mas personas se animen a conocerte.',
        ],
      },
      {
        heading: 'Pagado cuando la experiencia ofrece mayor profundidad',
        paragraphs: [
          'Cobrar tiene sentido cuando el tema es especifico, el acompanamiento es mas cercano o el resultado esperado requiere un mayor nivel de compromiso.',
          'Tambien ayuda a convocar a personas que ya identifican con claridad el valor de lo que van a recibir.',
        ],
        points: [
          'Tema concreto y relevante.',
          'Necesidad profesional bien definida.',
          'Propuesta con continuidad o seguimiento.',
        ],
      },
      {
        heading: 'La continuidad puede dar mas valor a la experiencia',
        paragraphs: [
          'Cuando un encuentro funciona bien, ofrecer materiales, seguimiento o beneficios posteriores puede enriquecer mucho la experiencia.',
          'Eso ayuda a que el evento no termine al cerrar la sesion, sino que se convierta en un paso dentro de un proceso mas amplio.',
        ],
      },
    ],
    ctaLabel: 'Explorar eventos',
  },
  {
    slug: 'membresia-que-retiene-y-no-cannibaliza',
    title: 'Una membresia bien disenada acompana tu crecimiento profesional',
    description:
      'Como reunir beneficios, acceso y acompanamiento para que una membresia aporte continuidad real a tu desarrollo profesional.',
    excerpt:
      'La membresia funciona mejor cuando suma continuidad, acompanamiento y beneficios utiles para seguir aprendiendo en el tiempo.',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readTime: '7 min',
    category: 'Membresias',
    featured: true,
    tags: ['membresia', 'continuidad', 'beneficios', 'comunidad'],
    canonicalFocus: ['academia', 'eventos'],
    assetLinks: [
      canonicalAssetLinks.academia,
      canonicalAssetLinks.eventos,
    ],
    intro:
      'Una buena membresia acompana el recorrido de aprendizaje y hace mas sencillo seguir avanzando con beneficios que realmente se usan.',
    sections: [
      {
        heading: 'Debe sumar valor, no generar confusion',
        paragraphs: [
          'Cuando una membresia esta bien pensada, ayuda a ordenar la experiencia y deja claro que beneficios acompanaran al miembro en el tiempo.',
          'Eso permite aprovechar mejor eventos, cursos y formaciones sin perder claridad sobre lo que incluye cada opcion.',
        ],
      },
      {
        heading: 'La continuidad es parte central de su valor',
        paragraphs: [
          'Las mejores membresias invitan a volver con regularidad gracias a beneficios practicos, acceso preferente y nuevas oportunidades para aprender.',
          'La sensacion no es simplemente "tener acceso", sino contar con una base de apoyo para seguir creciendo.',
        ],
        points: [
          'Acceso continuo a recursos y actividades.',
          'Prioridad o beneficios especiales para miembros.',
          'Ahorro frente a compras individuales.',
        ],
      },
      {
        heading: 'Cada propuesta puede conservar su valor propio',
        paragraphs: [
          'Una membresia bien estructurada convive de forma natural con otras propuestas y ayuda a que cada una tenga un lugar claro dentro del recorrido del usuario.',
          'Ese equilibrio facilita que la experiencia completa sea mas ordenada, comprensible y valiosa.',
        ],
      },
    ],
    ctaLabel: 'Conocer la academia',
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
