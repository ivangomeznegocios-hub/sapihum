import { getPublicCatalogDescription } from '@/lib/events/public'
import { sapihumStudyBlogPost } from '@/lib/research/sapihum-study'
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
  sapihumStudyBlogPost,
  {
    slug: 'autocuidado-del-terapeuta-prevenir-burnout',
    title: 'El autocuidado del terapeuta: Estrategias prácticas para prevenir el burnout',
    description:
      'Descubre cómo establecer límites saludables, gestionar la carga emocional y mantener el equilibrio en tu práctica clínica diaria.',
    excerpt:
      'La empatía constante y la exposición al dolor emocional pueden llevar al agotamiento. Exploramos estrategias basadas en evidencia para cuidar de ti mientras cuidas de otros.',
    publishedAt: '2026-04-15',
    updatedAt: '2026-04-15',
    readTime: '6 min',
    category: 'Bienestar y Autocuidado',
    featured: true,
    tags: ['autocuidado', 'burnout', 'salud mental', 'límites'],
    canonicalFocus: ['eventos', 'academia'],
    assetLinks: [
      canonicalAssetLinks.eventos,
      canonicalAssetLinks.academia,
    ],
    intro:
      'Como profesionales de la salud mental, nuestra principal herramienta de trabajo somos nosotros mismos. Sin embargo, a menudo relegamos nuestro bienestar a un segundo plano ante las demandas de nuestros pacientes.',
    sections: [
      {
        heading: 'Reconociendo las señales del desgaste por empatía',
        paragraphs: [
          'El primer paso para prevenir el burnout es identificar sus síntomas tempranos. La fatiga por compasión puede manifestarse como irritabilidad, insensibilización ante los problemas del paciente o agotamiento crónico.',
          'Es fundamental realizar un "check-in" emocional de forma regular para evaluar nuestro estado antes de llegar a un punto de crisis.',
        ],
        points: [
          'Dificultad para desconectar al finalizar la jornada.',
          'Sensación de ineficacia profesional.',
          'Aislamiento social o profesional.',
          'Cambios en los patrones de sueño o alimentación.',
        ],
      },
      {
        heading: 'El establecimiento de límites como herramienta terapéutica',
        paragraphs: [
          'Mantener límites claros no solo protege al terapeuta, sino que también modela relaciones saludables para el paciente. Esto incluye respetar estrictamente los horarios de inicio y fin de sesión.',
          'Aprender a decir "no" a nuevos pacientes cuando nuestra agenda está al límite es un acto de responsabilidad clínica.',
        ],
      },
      {
        heading: 'Espacios de supervisión y comunidad',
        paragraphs: [
          'El aislamiento es el mayor enemigo del terapeuta. Participar en grupos de supervisión y mantener una red de apoyo entre colegas es vital para procesar casos difíciles.',
          'Al compartir experiencias con otros profesionales, normalizamos nuestras dudas y renovamos nuestra energía.',
        ],
      },
    ],
    ctaLabel: 'Encuentra espacios de apoyo en nuestros próximos eventos',
  },
  {
    slug: 'integrando-nuevas-herramientas-clinicas',
    title: 'Integrando nuevas herramientas clínicas: Cómo elegir tu próxima formación',
    description:
      'Una guía para evaluar qué modelos terapéuticos o técnicas específicas aportarán más valor a tus pacientes y a tu estilo de intervención.',
    excerpt:
      'Con la creciente oferta de cursos y posgrados, saber elegir en qué invertir tu tiempo y recursos es clave para un desarrollo profesional con propósito.',
    publishedAt: '2026-04-05',
    updatedAt: '2026-04-10',
    readTime: '5 min',
    category: 'Desarrollo Profesional',
    tags: ['formación', 'técnicas', 'actualización', 'crecimiento'],
    canonicalFocus: ['academia', 'eventos'],
    assetLinks: [canonicalAssetLinks.academia, canonicalAssetLinks.eventos],
    intro:
      'La formación continua es un pilar ético de nuestra profesión. No obstante, acumular certificaciones sin un propósito claro puede llevar a la confusión metodológica. ¿Cómo seleccionamos la formación adecuada?',
    sections: [
      {
        heading: 'Evalúa la demanda de tu población clínica',
        paragraphs: [
          'Antes de inscribirte en un nuevo curso, revisa tu casuística actual. ¿Qué perfiles de pacientes predominan? ¿Qué tipo de problemas sientes que te cuestan más abordar?',
          'Elegir herramientas que respondan directamente a las necesidades de tus consultantes asegurará una aplicación práctica e inmediata de lo aprendido.',
        ],
      },
      {
        heading: 'Alineación con tu estilo terapéutico base',
        paragraphs: [
          'No todas las técnicas encajan con todas las personalidades clínicas. Si tu enfoque es predominantemente directivo, quizás un abordaje muy no estructurado genere fricción.',
          'Busca modelos que se integren de forma natural (o que ofrezcan un contraste complementario necesario) con la forma en que ya trabajas.',
        ],
        points: [
          'Revisa la evidencia empírica del nuevo modelo.',
          'Considera la curva de aprendizaje de la técnica.',
          'Busca formaciones que incluyan práctica supervisada.',
        ],
      },
      {
        heading: 'Profundidad vs. Amplitud',
        paragraphs: [
          'A veces es más valioso dominar profundamente dos o tres modelos terapéuticos que tener un conocimiento superficial de diez.',
          'La Academia está diseñada justamente para ofrecer opciones que van desde introducciones concisas hasta especializaciones profundas.',
        ],
      },
    ],
    ctaLabel: 'Explora nuestros programas académicos',
  },
  {
    slug: 'construyendo-practica-privada-sostenible',
    title: 'Construyendo una práctica privada sostenible y ética',
    description:
      'Estrategias de gestión y posicionamiento para que tu consulta clínica prospere sin comprometer la ética profesional.',
    excerpt:
      'Nadie nos enseña a gestionar un consultorio en la universidad. Aprende a definir tus honorarios, atraer pacientes ideales y estructurar tu modelo de atención.',
    publishedAt: '2026-03-28',
    updatedAt: '2026-03-29',
    readTime: '7 min',
    category: 'Gestión de Consulta',
    featured: true,
    tags: ['práctica privada', 'gestión', 'honorarios', 'ética'],
    canonicalFocus: ['eventos', 'academia'],
    assetLinks: [
      canonicalAssetLinks.eventos,
      canonicalAssetLinks.academia,
    ],
    intro:
      'Mantener una consulta privada viable económicamente a menudo genera dilemas éticos y ansiedad en los profesionales. Es posible construir una práctica sólida que beneficie tanto al terapeuta como al paciente.',
    sections: [
      {
        heading: 'El valor de tu trabajo y cómo establecer honorarios',
        paragraphs: [
          'El miedo a "cobrar demasiado" es una trampa común. Tus honorarios deben reflejar tu nivel de especialización, tus gastos operativos y la necesidad de tiempo para preparación y descanso.',
          'Un profesional bien remunerado es menos propenso al agotamiento y, por tanto, ofrece un mejor servicio clínico.',
        ],
      },
      {
        heading: 'Comunicación y presencia profesional',
        paragraphs: [
          'Tener presencia online no significa hacer promesas vacías ni comprometer la confidencialidad. Significa ser fácil de encontrar para quienes necesitan tu estilo de trabajo.',
          'La claridad en tu especialidad te ayudará a atraer pacientes con los que te sientas competente y motivado.',
        ],
        points: [
          'Define claramente tus áreas de expertise clínico.',
          'Crea políticas de cancelación transparentes desde la primera sesión.',
          'Mantén tus perfiles profesionales actualizados y profesionales.',
        ],
      },
      {
        heading: 'Administración del tiempo',
        paragraphs: [
          'La terapia no solo ocurre durante los 50 minutos de sesión. Redactar notas, preparar casos y supervisar requieren tiempo facturable (indirecto).',
          'Estructura tu agenda dejando márgenes de seguridad entre sesiones para evitar la sensación de estar "corriendo" todo el día.',
        ],
      },
    ],
    ctaLabel: 'Asiste a nuestros próximos encuentros profesionales',
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
