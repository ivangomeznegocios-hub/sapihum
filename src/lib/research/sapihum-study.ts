import type { BlogFigure, BlogMetric, BlogPost, BlogSection } from '@/lib/blog/types'

export const sapihumStudySlug = 'estado-practica-psicologica-bienestar-2025'

export const sapihumStudyPdfHref =
  '/investigacion/sapihum-2025/estado-practica-psicologica-2025-sapihum.pdf'

export const sapihumStudyMetrics: BlogMetric[] = [
  {
    label: 'Más pacientes',
    value: '64.5%',
    note: 'Reportó aumento en volumen de atención frente a 2024.',
  },
  {
    label: 'Más ingreso real',
    value: '48%',
    note: 'Percibió mejora real en su poder adquisitivo.',
  },
  {
    label: 'Modelo híbrido',
    value: '58%',
    note: 'Trabajó combinando atención online y presencial.',
  },
  {
    label: 'Agotamiento alto',
    value: '41%',
    note: 'Reportó niveles altos o muy altos de desgaste emocional.',
  },
  {
    label: 'Mensajes fuera de horario',
    value: '73%',
    note: 'Respondió a pacientes al menos dos veces por semana.',
  },
  {
    label: 'Terapia o supervisión',
    value: '68%',
    note: 'Asistió a proceso personal y/o supervisión de casos.',
  },
  {
    label: 'Historia clínica electrónica',
    value: '85%',
    note: 'Usó software en la nube para expedientes y seguimiento.',
  },
  {
    label: 'Uso de IA',
    value: '34%',
    note: 'Comenzó a usar herramientas de inteligencia artificial.',
  },
]

export const sapihumStudyFigures: BlogFigure[] = [
  {
    src: '/investigacion/sapihum-2025/figura-1-cambio-volumen-pacientes.png',
    alt: 'Cambio reportado en volumen de pacientes o clientes durante 2025',
    caption: '64.5% reportó aumento en el volumen de pacientes frente a 2024.',
  },
  {
    src: '/investigacion/sapihum-2025/figura-2-modalidad-atencion.png',
    alt: 'Modalidad de atención psicológica durante 2025',
    caption: 'La modalidad híbrida concentró 58% de la muestra.',
  },
  {
    src: '/investigacion/sapihum-2025/figura-3-bienestar-limites.png',
    alt: 'Indicadores de bienestar profesional y límites laborales',
    caption: '41% reportó agotamiento alto o muy alto y 73% respondió fuera de horario.',
  },
  {
    src: '/investigacion/sapihum-2025/figura-4-tecnologia-ia.png',
    alt: 'Adopción tecnológica y barreras éticas para inteligencia artificial',
    caption: '85% usa historia clínica electrónica y 34% ya usa IA; la confidencialidad sigue siendo una barrera central.',
  },
  {
    src: '/investigacion/sapihum-2025/figura-5-demanda-vs-ingreso.png',
    alt: 'Brecha entre aumento de demanda y mejora económica real',
    caption: 'Más demanda no significó automáticamente mejores condiciones económicas.',
  },
  {
    src: '/investigacion/sapihum-2025/figura-6-sintesis-indicadores.png',
    alt: 'Síntesis de indicadores principales del estudio SAPIHUM 2025',
    caption: 'Lectura global del estudio: crecimiento, digitalización y presión laboral al mismo tiempo.',
  },
]

export const sapihumStudySections: BlogSection[] = [
  {
    heading: 'Diseño y muestra',
    paragraphs: [
      'El estudio se levantó durante el primer trimestre de 2026 y reunió la experiencia de 312 profesionales de la psicología que ejercieron activamente durante 2025. Se trató de un diseño cuantitativo, no experimental, transversal y retrospectivo.',
      'La información provino de un cuestionario digital de 45 ítems aplicado mediante muestreo no probabilístico por conveniencia y bola de nieve. Por eso, los hallazgos son exploratorios y descriptivos, no una estimación representativa de todo el gremio.',
    ],
    points: [
      'Muestra final: 312 participantes.',
      'Instrumento ad hoc de 45 reactivos.',
      'Enfoque en demanda, modalidad, bienestar y tecnología.',
      'Lectura institucional orientada a la práctica profesional real.',
    ],
  },
  {
    heading: 'Más demanda, pero no más ingreso real',
    paragraphs: [
      'El 64.5% de los participantes reportó haber atendido más pacientes o clientes que en 2024. Sin embargo, solo el 48% indicó una mejora real en su poder adquisitivo.',
      'La brecha sugiere que trabajar más no siempre significa vivir mejor. Inflación, honorarios congelados, trabajo administrativo no cobrado y modelos de atención poco escalables explican parte de esa distancia.',
    ],
    points: [
      'La agenda creció, pero el ingreso no acompañó al mismo ritmo.',
      'El trabajo 1 a 1 sigue teniendo un techo económico claro.',
      'La carga administrativa también forma parte del costo profesional.',
    ],
  },
  {
    heading: 'El modelo híbrido se consolidó',
    paragraphs: [
      'La modalidad híbrida fue la más frecuente, con 58% de la muestra. El 27% trabajó 100% online y el 15% 100% presencial.',
      'La telepsicología ya no aparece como recurso de emergencia, sino como un estándar operativo que exige encuadre, consentimiento informado específico, privacidad digital y criterios claros de idoneidad.',
    ],
    points: [
      'Híbrida: flexibilidad y continuidad.',
      'Online: acceso y alcance ampliado.',
      'Presencial: sigue siendo valiosa en procesos que lo requieren.',
    ],
  },
  {
    heading: 'Bienestar, límites y supervisión',
    paragraphs: [
      'El 41% reportó niveles altos o muy altos de agotamiento emocional. Además, el 73% reconoció responder mensajes fuera de su horario laboral al menos dos veces por semana.',
      'La buena noticia es que el 68% asistió a terapia personal y/o supervisión durante 2025. Eso muestra una cultura profesional más consciente, aunque todavía insuficiente para compensar modelos de trabajo que desgastan de forma estructural.',
    ],
    points: [
      'El límite no es frialdad: es parte del encuadre terapéutico.',
      'La disponibilidad permanente no equivale a mejor atención.',
      'Supervisión y terapia ayudan, pero no sustituyen cambios de estructura.',
    ],
  },
  {
    heading: 'Tecnología e inteligencia artificial',
    paragraphs: [
      'El 85% utiliza historia clínica electrónica en la nube, lo que confirma que la digitalización administrativa ya está integrada en la práctica cotidiana.',
      'La adopción de IA aún es temprana: 34% declaró usarla, sobre todo para tareas administrativas o de apoyo documental. Entre quienes no la usan, la confidencialidad apareció como principal barrera en 78% de los casos.',
    ],
    points: [
      'La alfabetización digital ya es una competencia profesional básica.',
      'La IA puede apoyar, pero no reemplazar el criterio clínico.',
      'La confidencialidad sigue siendo el centro del debate ético.',
    ],
  },
  {
    heading: 'Lectura institucional',
    paragraphs: [
      'La conclusión general es clara: la psicología está creciendo, pero el modelo de trabajo de muchos profesionales todavía no está preparado para sostener ese crecimiento sin desgaste.',
      'SAPIHUM presenta este estudio como una base para hablar de límites, honorarios, telepsicología, IA ética, supervisión y nuevas formas de formación y comunidad profesional.',
    ],
    points: [
      'Sostener mejor al paciente exige sostener mejor al psicólogo.',
      'El crecimiento profesional necesita estructura, no solo más demanda.',
      'La conversación gremial debe apoyarse en datos, no en intuiciones.',
    ],
  },
]

export const sapihumStudyBlogPost: BlogPost = {
  slug: sapihumStudySlug,
  title: 'El estado de la práctica psicológica y el bienestar profesional en 2025: estudio transversal retrospectivo en 312 profesionales de la psicología',
  description:
    'Estudio institucional de SAPIHUM sobre demanda de servicios, modalidad de atención, bienestar profesional, límites laborales y adopción tecnológica durante 2025.',
  excerpt:
    'La práctica psicológica creció en demanda y digitalización durante 2025, pero también mostró una brecha clara entre trabajo e ingreso, junto con señales importantes de desgaste y dificultad para desconectarse.',
  publishedAt: '2026-04-28',
  updatedAt: '2026-04-28',
  readTime: '10 min',
  category: 'Investigación aplicada',
  featured: true,
  tags: ['investigación', 'SAPIHUM', 'burnout', 'telepsicología', 'IA', 'bienestar profesional'],
  canonicalFocus: ['eventos', 'academia'],
  assetLinks: [
    {
      label: 'Explorar eventos',
      href: '/eventos',
      kind: 'eventos',
    },
    {
      label: 'Ver catalogo',
      href: '/academia',
      kind: 'academia',
    },
  ],
  resources: [
    {
      label: 'Descargar PDF',
      href: sapihumStudyPdfHref,
      description: 'Versión completa del artículo científico en PDF.',
    },
    {
      label: 'Abrir investigación',
      href: '/investigacion',
      description: 'Publicación destacada en el área institucional.',
    },
  ],
  stats: sapihumStudyMetrics,
  figures: sapihumStudyFigures,
  intro:
    'SAPIHUM presenta un estudio transversal retrospectivo con 312 profesionales de la psicología que ejercieron activamente durante 2025. El objetivo fue leer la práctica real del gremio desde cuatro ángulos: demanda, modalidad de trabajo, bienestar profesional y adopción tecnológica.',
  sections: sapihumStudySections,
  ctaLabel: 'Ver la publicación en investigación',
  ctaLink: '/investigacion',
}
