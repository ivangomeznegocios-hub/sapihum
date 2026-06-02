import type { OrganicContentAsset } from './types'

export const ORGANIC_CONTENT: OrganicContentAsset[] = [
    {
        slug: 'formulacion-de-caso-clinico',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Formulación de caso clínico para psicólogos',
        description:
            'Una guía base para ordenar hipótesis, factores mantenedores, objetivos y plan de intervención sin perder criterio clínico.',
        aiSummary:
            'Guía introductoria sobre formulación de caso clínico para psicólogos. Explica cómo organizar motivo de consulta, factores relevantes, hipótesis y objetivos terapéuticos con un formato descargable.',
        topic: 'formulacion de caso',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Guía clínica',
        ctaLabel: 'Descargar formato de formulación',
        intent: 'download_resource',
        actionType: 'resource_download',
        interestTags: ['evaluacion_clinica', 'formulacion_caso', 'practica_clinica'],
        publishedAt: '2026-05-29',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Qué debe resolver una formulación',
                paragraphs: [
                    'Una formulación útil traduce información clínica dispersa en una explicación de trabajo. No sustituye el diagnóstico, pero ayuda a decidir por dónde intervenir primero.',
                    'El objetivo es integrar antecedentes, disparadores, mantenedores, recursos y riesgos en una hipótesis clara que pueda revisarse conforme avanza el proceso.',
                ],
                bullets: [
                    'Motivo de consulta expresado en lenguaje observable.',
                    'Factores predisponentes, precipitantes y mantenedores.',
                    'Objetivos terapéuticos priorizados.',
                ],
            },
            {
                heading: 'Uso profesional del formato',
                paragraphs: [
                    'El formato descargable está pensado como punto de partida para psicólogos que quieren documentar mejor sus decisiones clínicas.',
                    'Debe adaptarse al modelo terapéutico, al marco legal aplicable y al nivel de riesgo de cada caso.',
                ],
            },
            {
                heading: 'Límites profesionales y disclaimer',
                paragraphs: [
                    'Este contenido es informativo y profesional; no sustituye supervisión clínica, criterio profesional, formación especializada ni asesoría legal cuando corresponda.',
                ],
            },
        ],
        faqs: [
            {
                question: 'La formulación reemplaza el diagnóstico?',
                answer: 'No. La formulación complementa el diagnóstico porque organiza hipótesis y decisiones de intervención.',
            },
            {
                question: 'Puedo usarla con cualquier enfoque?',
                answer: 'Sí, como estructura base. Cada enfoque puede ajustar variables, lenguaje y prioridades.',
            },
        ],
        gatedResource: {
            assetKey: 'formulacion-caso-clinico',
            title: 'Formato descargable de formulación de caso',
            description: 'Plantilla breve para ordenar hipótesis, objetivos y plan inicial.',
            benefits: [
                'Estructura editable para primera formulación.',
                'Campos para hipótesis, mantenedores y objetivos.',
                'Uso inmediato en supervisión o práctica privada.',
            ],
            downloadUrl: '/api/organic-resources/formulacion-caso-clinico',
        },
        relatedAssets: [
            { label: 'Especialidad en Evaluación Clínica', href: '/especialidades/evaluacion-clinica', type: 'specialty' },
            { label: 'Explorar formaciones', href: '/formaciones', type: 'formation' },
            { label: 'Comunidad SAPIHUM', href: '/comunidad', type: 'community' },
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage', 'ItemList'],
    },
    {
        slug: 'historia-clinica-psicologica',
        contentType: 'resource_format',
        sourceType: 'resource_format',
        title: 'Formato de historia clínica psicológica',
        description:
            'Preview indexable de un formato para organizar datos iniciales, motivo de consulta, antecedentes y plan de atención psicológica.',
        aiSummary:
            'Recurso para psicólogos sobre historia clínica psicológica. Resume los apartados mínimos para documentar una primera entrevista y ofrece una descarga posterior al registro.',
        topic: 'historia clinica',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Formato profesional',
        ctaLabel: 'Desbloquear formato',
        intent: 'download_resource',
        actionType: 'resource_download',
        interestTags: ['historia_clinica', 'evaluacion_clinica', 'documentacion_clinica'],
        publishedAt: '2026-05-29',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Apartados base',
                paragraphs: [
                    'Una historia clínica ordenada permite entender el contexto inicial del consultante sin convertir la entrevista en un interrogatorio rígido.',
                    'El formato separa datos administrativos, motivo de consulta, antecedentes, observaciones clínicas y acuerdos iniciales.',
                ],
                bullets: [
                    'Datos de identificación y contacto.',
                    'Motivo de consulta y objetivos iniciales.',
                    'Antecedentes relevantes y factores de riesgo.',
                ],
            },
            {
                heading: 'Uso responsable',
                paragraphs: [
                    'El recurso es una base de trabajo. Cada profesional debe adecuarlo a su jurisdicción, política de privacidad y tipo de servicio.',
                ],
            },
            {
                heading: 'Límites profesionales y disclaimer',
                paragraphs: [
                    'Este contenido es informativo y profesional; no sustituye supervisión clínica, criterio profesional, formación especializada ni asesoría legal cuando corresponda.',
                ],
            },
        ],
        gatedResource: {
            assetKey: 'historia-clinica-psicologica',
            title: 'Formato descargable de historia clínica',
            description: 'Plantilla para entrevista inicial y documentación básica.',
            benefits: [
                'Preview público e indexable.',
                'Campos listos para adaptar.',
                'Conecta con rutas de evaluación clínica y formación.',
            ],
            downloadUrl: '/api/organic-resources/historia-clinica-psicologica',
        },
        relatedAssets: [
            { label: 'Guía de formulación de caso', href: '/guias/formulacion-de-caso-clinico', type: 'guide' },
            { label: 'Recursos SAPIHUM', href: '/recursos', type: 'resource' },
            { label: 'Eventos profesionales', href: '/eventos', type: 'event' },
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'ItemList'],
    },
    {
        slug: 'como-conseguir-pacientes-como-psicologo',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Cómo conseguir pacientes como psicólogo: guía de captación ética',
        description: 'Descubre estrategias éticas, efectivas y con sustento profesional para atraer pacientes a tu consulta privada sin recurrir a la desinformación.',
        aiSummary: 'Los formatos de captación y guías éticas ayudan a psicólogos a estructurar su práctica privada, definir nichos y establecer colaboraciones sólidas sin comprometer el código deontológico.',
        topic: 'captacion de pacientes',
        specialty: 'supervision_clinica',
        heroEyebrow: 'Guía de crecimiento',
        ctaLabel: 'Unirme a la comunidad',
        intent: 'join_community',
        actionType: 'guide_view',
        interestTags: ['captacion_pacientes', 'consulta_privada', 'marketing_psicologos', 'comunidad'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'La diferenciación en la práctica privada',
                paragraphs: [
                    'La competencia en psicoterapia ha aumentado radicalmente en los canales digitales. Para sobresalir, es fundamental alejarse del generalismo y definir un nicho claro basado en tu experiencia y formación.',
                    'Atraer al paciente adecuado no es cuestión de trucos publicitarios, sino de construir confianza técnica a través del contenido de valor y la rigurosidad ética.'
                ],
                bullets: [
                    'Define tu área de competencia específica (p. ej., trauma, ansiedad en adultos).',
                    'Crea contenido que explique de forma sencilla cómo funciona tu enfoque terapéutico.',
                    'Mantén la coherencia profesional y el respeto por los códigos éticos de salud mental.'
                ]
            },
            {
                heading: 'Redes de derivación profesional',
                paragraphs: [
                    'Las derivaciones de otros colegas, psiquiatras y centros de salud siguen siendo la fuente de pacientes más sólida y de mejor pronóstico en la clínica.',
                    'Construir relaciones interdisciplinarias éticas te permite recibir casos alineados con tu especialidad y derivar con responsabilidad aquellos que queden fuera de tu alcance.'
                ]
            },
            {
                heading: 'Estrategias y disclaimer ético',
                paragraphs: [
                    'Este contenido es informativo y profesional; no sustituye la supervisión clínica, el criterio profesional individual ni las normativas de salud locales vigentes en cada país.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Es ético hacer publicidad pagada en psicología?',
                answer: 'Sí, siempre que la publicidad sea verídica, profesional, no haga promesas clínicas absolutas ni demerite el trabajo de otros colegas.'
            },
            {
                question: '¿Cómo ayuda SAPIHUM a conseguir pacientes?',
                answer: 'A través de nuestra comunidad profesional, redes de derivación verificadas y formaciones continuas que elevan tu autoridad clínica.'
            }
        ],
        relatedAssets: [
            { label: 'Guía de Marketing para Psicólogos', href: '/guias/marketing-para-psicologos', type: 'guide' },
            { label: 'Especialidad en Supervisión Clínica', href: '/especialidades/supervision-clinica', type: 'specialty' },
            { label: 'Comunidad SAPIHUM', href: '/comunidad', type: 'community' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'como-cobrar-consulta-psicologica',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Cómo cobrar consulta psicológica y definir tus honorarios',
        description: 'Aprende a estructurar tus tarifas profesionales en consulta privada de forma justa, viable y éticamente equilibrada.',
        aiSummary: 'Guía práctica para que psicólogos clínicos definan sus tarifas por consulta privada. Analiza costos operativos directos, indirectos, valor de mercado y psicología del cobro.',
        topic: 'consulta privada',
        specialty: 'supervision_clinica',
        heroEyebrow: 'Gestión profesional',
        ctaLabel: 'Registrarme gratis',
        intent: 'explore_formation',
        actionType: 'guide_view',
        interestTags: ['consulta_privada', 'practica_clinica', 'supervision_clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Estructuración de costos en consulta',
                paragraphs: [
                    'Definir el precio de una sesión de psicoterapia suele ser una de las tareas más complejas para los nuevos clínicos. Cobrar muy poco desgasta la práctica y compromete la calidad; cobrar demasiado puede limitar el acceso a la población.',
                    'El primer paso fundamental es conocer tus gastos de operación fijos y variables. Esto incluye renta de consultorio físico o software de consulta, servicios de internet, impuestos, seguros y tu propia formación continua.'
                ],
                bullets: [
                    'Costos fijos directos: Renta de espacio, software clínico y suscripciones.',
                    'Formación continua y supervisión: Porcentaje de ingresos destinado a tu desarrollo técnico.',
                    'Tu tiempo no clínico: Horas dedicadas a documentar expedientes y preparar sesiones.'
                ]
            },
            {
                heading: 'La psicología del cobro y los límites terapéuticos',
                paragraphs: [
                    'El encuadre del pago no es un trámite puramente administrativo; forma parte integral de la relación terapéutica. Establecer límites claros sobre cancelaciones y formas de pago ayuda a evitar malentendidos.',
                    'Es recomendable pactar y firmar las políticas de cobro desde la primera sesión (o incluirlas en el consentimiento informado).'
                ]
            },
            {
                heading: 'Disclaimer profesional',
                paragraphs: [
                    'Este contenido es meramente informativo y profesional; no sustituye la asesoría fiscal particular ni las normativas tarifarias que puedan existir en algunas regiones.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué hacer si un paciente no puede pagar su tarifa habitual?',
                answer: 'Muchos profesionales de la salud mental reservan un porcentaje de sus horas clínicas a tarifas diferenciadas o tarifas sociales para garantizar el acceso ético.'
            },
            {
                question: '¿Es correcto cobrar sesiones no asistidas?',
                answer: 'Sí, siempre que las políticas de cancelación (p. ej., avisar con 24 horas de anticipación) hayan sido explicadas y aceptadas al inicio del tratamiento.'
            }
        ],
        relatedAssets: [
            { label: 'Plantilla de Consentimiento Informado', href: '/recursos/formatos/consentimiento-informado-psicologico', type: 'resource_format' },
            { label: 'Formaciones Clínicas', href: '/formaciones', type: 'formation' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'como-abrir-consultorio-psicologico',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Cómo abrir un consultorio psicológico: requisitos y pasos clave',
        description: 'Guía paso a paso sobre los requisitos legales, logísticos y prácticos para establecer tu propio consultorio de psicología de forma exitosa.',
        aiSummary: 'Guía práctica sobre los requisitos para la apertura de un consultorio psicológico. Abarca habilitación sanitaria, regulaciones, diseño del espacio y digitalización.',
        topic: 'consulta privada',
        specialty: 'clinica',
        heroEyebrow: 'Guía de emprendimiento',
        ctaLabel: 'Ver próximos eventos',
        intent: 'evaluate_membership',
        actionType: 'commercial_cta',
        interestTags: ['consulta_privada', 'normativas', 'herramientas_digitales', 'clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Cumplimiento normativo y habilitaciones',
                paragraphs: [
                    'Establecer un consultorio físico o virtual requiere cumplir con una serie de normativas locales para garantizar que el espacio es seguro para la atención en salud mental.',
                    'Esto incluye autorizaciones sanitarias locales, normativas sobre el resguardo y confidencialidad del expediente clínico (como la NOM-004 o equivalentes nacionales) e inscripciones fiscales correspondientes.'
                ],
                bullets: [
                    'Registro ante las autoridades sanitarias nacionales o municipales.',
                    'Cumplimiento con normativas de accesibilidad física y seguridad civil.',
                    'Implementación de contratos de confidencialidad y políticas de privacidad sólidas.'
                ]
            },
            {
                heading: 'Diseño del encuadre y espacio terapéutico',
                paragraphs: [
                    'El ambiente físico del consultorio influye directamente en el estado emocional y la comodidad del consultante. La iluminación suave, colores neutros, aislamiento acústico y disposición del mobiliario son elementos activos del encuadre clínico.',
                    'En la consulta virtual, es igualmente crítico contar con un fondo profesional, libre de interrupciones y una conexión de internet encriptada y estable.'
                ]
            },
            {
                heading: 'Advertencia clínica y legal',
                paragraphs: [
                    'Las regulaciones varían significativamente entre países y provincias. Se aconseja obtener asesoría legal y sanitaria local antes de firmar contratos de arrendamiento o adquirir mobiliario clínico.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Puedo atender en un consultorio compartido?',
                answer: 'Sí, la renta de consultorios compartidos o coworkings de psicología es una excelente opción inicial para reducir costos de operación fijos.'
            },
            {
                question: '¿Cuáles son los requisitos digitales mínimos?',
                answer: 'Un software clínico que cumpla con la protección de datos personales y cifrado de extremo a extremo para las videoconsultas.'
            }
        ],
        relatedAssets: [
            { label: 'Checklist de Consulta Organizada', href: '/recursos/formatos/checklist-consulta-organizada', type: 'resource_format' },
            { label: 'Membresía Profesional SAPIHUM', href: '/membresia', type: 'specialty' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'como-organizar-practica-clinica',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Cómo organizar tu práctica clínica como psicólogo autónomo',
        description: 'Aprende a estructurar tus horarios, expedientes, agenda y finanzas para disfrutar de una consulta privada eficiente y sin estrés.',
        aiSummary: 'Guía sobre gestión, administración y optimización del tiempo para psicólogos en consulta privada autónoma. Enseña a separar la labor administrativa de la atención clínica.',
        topic: 'consulta privada',
        specialty: 'clinica',
        heroEyebrow: 'Organización clínica',
        ctaLabel: 'Registrarme gratis',
        intent: 'join_community',
        actionType: 'guide_view',
        interestTags: ['consulta_privada', 'herramientas_digitales', 'formatos_clinicos', 'clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'La división del tiempo: labor clínica vs. labor administrativa',
                paragraphs: [
                    'El agotamiento del psicólogo autónomo muchas veces no proviene del trabajo con los pacientes, sino de la mala organización de las tareas de gestión. Documentar notas clínicas tarde en la noche o responder mensajes de WhatsApp a toda hora socava la calidad del servicio.',
                    'La clave está en reservar bloques de tiempo dedicados exclusivamente a tareas administrativas: registro de expedientes, facturación, responder consultas informativas y preparar tus próximas sesiones.'
                ],
                bullets: [
                    'Crea bloques de administración en tu calendario semanal (p. ej., 1 hora al final del día).',
                    'Establece canales oficiales para que tus pacientes reserven y cancelen de forma automática.',
                    'Usa herramientas digitales diseñadas específicamente para terapeutas autónomos.'
                ]
            },
            {
                heading: 'El resguardo ético de los expedientes',
                paragraphs: [
                    'Llevar un orden sistemático de tus fichas clínicas no es solo una obligación legal; es un pilar de la efectividad clínica. Conectar la historia clínica, los registros conductuales y los objetivos de tratamiento te permite evaluar objetivamente el avance de tus procesos terapéuticos.'
                ]
            },
            {
                heading: 'Enfoque ético y disclaimer',
                paragraphs: [
                    'Este contenido es de carácter netamente informativo y educativo; cada profesional clínico debe adaptar estas recomendaciones a su propio estilo de trabajo y a la legislación aplicable.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Cuánto tiempo debo guardar el expediente clínico?',
                answer: 'En la mayoría de los países de habla hispana, el expediente clínico psicológico debe resguardarse por un mínimo de 5 años tras la última sesión.'
            },
            {
                question: '¿Cómo ayuda SAPIHUM a organizar mi consulta?',
                answer: 'Proporcionamos plantillas, checklists y formaciones aplicadas que te ayudan a automatizar y ordenar la administración de tu consulta.'
            }
        ],
        relatedAssets: [
            { label: 'Checklist de Consulta Organizada', href: '/recursos/formatos/checklist-consulta-organizada', type: 'resource_format' },
            { label: 'Guía de Herramientas Digitales', href: '/herramientas/herramientas-digitales-para-psicologos', type: 'tool' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'marketing-para-psicologos',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Marketing para psicólogos: estrategias digitales éticas',
        description: 'Desarrolla una marca personal robusta y atrae pacientes calificados a tu consulta privada mediante marketing de contenidos riguroso y ético.',
        aiSummary: 'Guía de marketing ético para psicólogos clínicos. Analiza la creación de blogs profesionales, marca personal fundamentada, redes sociales en salud mental y SEO local.',
        topic: 'marketing para psicologos',
        specialty: 'supervision_clinica',
        heroEyebrow: 'Estrategia de growth',
        ctaLabel: 'Ver próximos eventos',
        intent: 'explore_formation',
        actionType: 'guide_view',
        interestTags: ['marketing_psicologos', 'captacion_pacientes', 'consulta_privada', 'comunidad'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'El marketing de contenidos como puente de confianza',
                paragraphs: [
                    'El marketing tradicional enfocado en la venta directa suele generar desconfianza en el sector de la salud mental. En su lugar, el marketing de contenidos se posiciona como una herramienta sumamente ética y efectiva.',
                    'Consiste en escribir artículos, grabar videos o dar talleres informativos que resuelvan dudas reales de tus futuros pacientes. Al explicar científicamente qué es la ansiedad, cómo funciona el duelo o cuándo asistir a terapia familiar, construyes una sólida autoridad intelectual.'
                ],
                bullets: [
                    'SEO local: Posiciona tu consulta en Google Maps para que te encuentren en tu ciudad.',
                    'Marca personal: Comparte tu formación, tus enfoques terapéuticos y tus valores profesionales.',
                    'Contenido educativo: Explica de manera científica y empática temas de salud mental comunes.'
                ]
            },
            {
                heading: 'Límites éticos de la comunicación en salud mental',
                paragraphs: [
                    'Es fundamental no utilizar tácticas sensacionalistas (clickbait) ni promesas clínicas absolutas (como "cura tu depresión en 3 sesiones"). La comunicación del psicólogo debe ser siempre rigurosa, humilde y fundamentada en la evidencia empírica.'
                ]
            },
            {
                heading: 'Disclaimer ético',
                paragraphs: [
                    'Esta guía es de divulgación profesional; no sustituye la revisión legal y deontológica aplicable por los colegios y asociaciones de psicología locales.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué redes sociales son mejores para un psicólogo?',
                answer: 'Aquellas donde tus consultantes busquen información educativa seria. Instagram, LinkedIn y YouTube son excelentes plataformas para compartir contenido de valor.'
            },
            {
                question: '¿Puedo publicar testimonios de pacientes?',
                answer: 'En muchos códigos éticos de psicología clínica de habla hispana, el uso de testimonios de pacientes activos o pasados está restringido o prohibido para evitar sesgos y manipulación.'
            }
        ],
        relatedAssets: [
            { label: 'Guía para Conseguir Pacientes', href: '/guias/como-conseguir-pacientes-como-psicologo', type: 'guide' },
            { label: 'Comunidad SAPIHUM', href: '/comunidad', type: 'community' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'guia-expediente-psicologico',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Guía del expediente psicológico clínico y normativo',
        description: 'Aprende a estructurar el expediente psicológico clínico de tus consultantes respetando normativas legales y el secreto profesional.',
        aiSummary: 'El expediente psicológico clínico profesional ayuda a los terapeutas a resguardar la información del paciente, documentar la evolución de forma rigurosa y cumplir con las normativas oficiales.',
        topic: 'expediente clinico',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Recurso premium',
        ctaLabel: 'Descargar guía rápida',
        intent: 'download_resource',
        actionType: 'resource_download',
        interestTags: ['expediente_clinico', 'formatos_clinicos', 'normativas', 'evaluacion_clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Estructura normativa del expediente clínico',
                paragraphs: [
                    'El expediente psicológico es el conjunto único de documentos escritos, gráficos y digitales donde se registran los procesos de evaluación y psicoterapia de un consultante.',
                    'Llevarlo de manera correcta no solo te blinda legalmente ante auditorías sanitarias, sino que garantiza la continuidad terapéutica y el respeto sistemático por los derechos del paciente.'
                ],
                bullets: [
                    'Ficha de identificación completa del consultante.',
                    'Consentimiento informado debidamente firmado.',
                    'Historia clínica completa con antecedentes médicos y familiares.',
                    'Notas de evolución ordenadas cronológicamente.'
                ]
            },
            {
                heading: 'Confidencialidad y secreto profesional',
                paragraphs: [
                    'El resguardo físico o digital de estos archivos debe contar con medidas de seguridad robustas (encriptación, llaves físicas o contraseñas fuertes). La confidencialidad es un derecho inalienable del paciente que solo puede levantarse bajo orden judicial expresa o riesgo inminente de vida.'
                ]
            },
            {
                heading: 'Límites profesionales y disclaimer',
                paragraphs: [
                    'Este contenido es exclusivamente informativo y profesional; no sustituye la supervisión clínica de casos, la formación especializada correspondiente, ni la asesoría legal particular adaptada a la legislación de salud mental de tu país.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué información NUNCA debe faltar en el expediente?',
                answer: 'Los datos de contacto de emergencia, el consentimiento informado firmado y el registro claro de factores de riesgo o ideación suicida.'
            },
            {
                question: '¿Cómo ayuda SAPIHUM con mi expediente clínico?',
                answer: 'Ofrecemos guías rápidas, formaciones en evaluación diagnóstica y estructuras que facilitan el llenado diario en tu consulta.'
            }
        ],
        gatedResource: {
            assetKey: 'guia-expediente-psicologico',
            title: 'Guía rápida de expediente psicológico',
            description: 'Manual conciso con el checklist y los apartados esenciales para estructurar expedientes profesionales en salud mental.',
            benefits: [
                'Estructura adaptada a normativas de salud generales.',
                'Checklist de apartados clínicos indispensables.',
                'Consejos prácticos para la protección y archivo de datos.'
            ],
            downloadUrl: '/api/organic-resources/guia-expediente-psicologico'
        },
        relatedAssets: [
            { label: 'Formato de Historia Clínica', href: '/recursos/formatos/historia-clinica-psicologica', type: 'resource_format' },
            { label: 'Especialidad en Evaluación Clínica', href: '/especialidades/evaluacion-clinica', type: 'specialty' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'consentimiento-informado-psicologico',
        contentType: 'resource_format',
        sourceType: 'resource_format',
        title: 'Consentimiento informado psicológico: formato y guía ética',
        description: 'Descarga un formato editable de consentimiento informado en psicoterapia y comprende su correcto encuadre clínico y legal.',
        aiSummary: 'El consentimiento informado para psicología es un documento fundamental que resguarda los derechos del consultante y establece las reglas de la consulta, confidencialidad, límites de la terapia y métodos de pago de forma transparente.',
        topic: 'consentimiento informado',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Plantilla descargable',
        ctaLabel: 'Descargar plantilla',
        intent: 'download_resource',
        actionType: 'resource_download',
        interestTags: ['consentimiento_informado', 'formatos_clinicos', 'practica_clinica', 'evaluacion_clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'El consentimiento como proceso y documento',
                paragraphs: [
                    'El consentimiento informado en psicología no es un simple papel administrativo que se firma y se archiva apresuradamente al inicio de la terapia; es un proceso continuo que asegura el derecho del paciente a saber cómo funciona su tratamiento.',
                    'Debe explicar de manera clara y directa en qué consistirá el enfoque psicoterapéutico, las metas tentativas de la intervención, las tarifas, los horarios y las políticas asociadas a las inasistencias.'
                ],
                bullets: [
                    'Confidencialidad: Explicación clara del secreto clínico profesional.',
                    'Excepciones legales al secreto (riesgo de vida del paciente o de terceros).',
                    'Políticas administrativas (costo, duración y cancelación de sesiones).'
                ]
            },
            {
                heading: 'Uso ético y adaptabilidad local',
                paragraphs: [
                    'Cada jurisdicción cuenta con regulaciones de salud específicas. Por ello, la plantilla que descargues de SAPIHUM debe ser considerada un punto de partida profesional de referencia, y requiere ser adaptada a los requerimientos legales vigentes de tu localidad.'
                ]
            },
            {
                heading: 'Límites de responsabilidad profesional',
                paragraphs: [
                    'Este contenido es estrictamente de carácter informativo; no sustituye la supervisión clínica de tu ejercicio clínico, tu juicio especializado individual, ni la asesoría legal especializada correspondiente.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿A qué edad se puede firmar el consentimiento?',
                answer: 'Por regla general, los adultos competentes lo firman por sí mismos. En el caso de menores de edad, deben firmarlo el padre, la madre o el tutor legal correspondiente, acompañados de un asentimiento informado del menor.'
            },
            {
                question: '¿Se puede retirar el consentimiento?',
                answer: 'Sí, el consultante tiene el derecho absoluto de revocar su consentimiento y dar por terminada la relación terapéutica en cualquier momento.'
            }
        ],
        gatedResource: {
            assetKey: 'consentimiento-informado-psicologico',
            title: 'Plantilla de consentimiento informado psicológico',
            description: 'Formato editable en formato plantilla con los campos esenciales de confidencialidad, encuadre clínico y políticas administrativas.',
            benefits: [
                'Campos estructurados listos para rellenar.',
                'Redacción clara y amigable para el consultante.',
                'Incluye secciones para límites del secreto clínico.'
            ],
            downloadUrl: '/api/organic-resources/consentimiento-informado-psicologico'
        },
        relatedAssets: [
            { label: 'Formato de Historia Clínica', href: '/recursos/formatos/historia-clinica-psicologica', type: 'resource_format' },
            { label: 'Guía de Expediente Psicológico', href: '/guias/guia-expediente-psicologico', type: 'guide' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'expediente-psicologico',
        contentType: 'resource_format',
        sourceType: 'resource_format',
        title: 'Formato y estructura del expediente psicológico profesional',
        description: 'Organiza la documentación de tu consulta clínica de manera profesional mediante un sistema de expedientes estructurado.',
        aiSummary: 'El expediente clínico completo para psicólogos organiza la historia del paciente, notas de evolución, escalas estandarizadas y consentimientos. Facilita la toma de decisiones clínicas diagnósticas.',
        topic: 'expediente clinico',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Estructura clínica',
        ctaLabel: 'Explorar recursos',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['expediente_clinico', 'formatos_clinicos', 'practica_clinica', 'evaluacion_clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'La utilidad clínica del expediente ordenado',
                paragraphs: [
                    'Un expediente psicológico no es un mero requisito formal de archivo. Es el mapa vivo del proceso de cambio del paciente. Te permite contrastar la evolución diagnóstica, revisar si las técnicas empleadas están surtiendo efecto y ajustar los objetivos según el curso clínico.',
                    'Llevar un orden claro previene la negligencia, ayuda en procesos de supervisión clínica de casos complejos y respalda tus decisiones técnicas ante cualquier eventualidad.'
                ],
                bullets: [
                    'Diagnóstico multiaxial o descriptivo claro basado en taxonomías reconocidas (DSM-5 / CIE-11).',
                    'Notas de evolución enlazadas a los objetivos terapéuticos principales.',
                    'Registro sistemático de crisis emocionales o de ideación de riesgo.'
                ]
            },
            {
                heading: 'Normativa de protección de datos personales',
                paragraphs: [
                    'En la práctica privada, garantizar que el expediente esté a salvo del acceso de terceros es una prioridad ética insoslayable. Si utilizas almacenamiento en la nube, asegúrate de que el proveedor cuente con certificaciones de seguridad para datos de salud.'
                ]
            },
            {
                heading: 'Enfoque ético y disclaimer',
                paragraphs: [
                    'Este contenido clínico es puramente orientativo e informativo; no sustituye la supervisión técnica sistemática ni el estudio a profundidad del marco legal regulatorio aplicable en tu jurisdicción.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué hacer si un paciente pide copia de su expediente?',
                answer: 'De acuerdo con los derechos ARCO (o equivalentes de salud mental), el paciente tiene derecho a solicitar un resumen clínico de su expediente redactado de forma ética por el profesional tratante.'
            },
            {
                question: '¿Cómo estructurar las sesiones subsecuentes?',
                answer: 'Mediante notas de evolución en formatos normalizados que retomen los avances del plan de tratamiento y las tareas encomendadas.'
            }
        ],
        relatedAssets: [
            { label: 'Guía de Expediente Psicológico', href: '/guias/guia-expediente-psicologico', type: 'guide' },
            { label: 'Formato de Consentimiento Informado', href: '/recursos/formatos/consentimiento-informado-psicologico', type: 'resource_format' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'nota-clinica-psicologica',
        contentType: 'resource_format',
        sourceType: 'resource_format',
        title: 'Nota clínica psicológica: formato estructurado',
        description: 'Optimiza el registro de tus sesiones terapéuticas con un formato y plantilla descargable de nota clínica profesional.',
        aiSummary: 'Las notas clínicas psicológicas profesionales ayudan a estructurar y agilizar el registro diario de cada sesión de psicoterapia, asegurando el seguimiento de los objetivos terapéuticos y la síntesis clínica de la evolución.',
        topic: 'nota clinica',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Plantilla descargable',
        ctaLabel: 'Descargar plantilla',
        intent: 'download_resource',
        actionType: 'resource_download',
        interestTags: ['nota_clinica', 'formatos_clinicos', 'practica_clinica', 'evaluacion_clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'La importancia clínica del registro diario',
                paragraphs: [
                    'Escribir la nota clínica después de cada sesión no solo es un deber ético, sino el método más efectivo para sistematizar el trabajo terapéutico.',
                    'Una nota estructurada te ayuda a retomar la sesión posterior justo donde se quedó, evaluar el cumplimiento de tareas clínicas asignadas y detectar patrones repetitivos sin saturarte de notas vagas.'
                ],
                bullets: [
                    'Resumen observable de la sesión terapéutica.',
                    'Evaluación clínica subjetiva y objetiva del estado emocional.',
                    'Tareas asignadas, intervenciones empleadas y plan para la siguiente cita.'
                ]
            },
            {
                heading: 'Metodologías estructuradas (formato SOAP)',
                paragraphs: [
                    'El formato SOAP (Subjetivo, Objetivo, Análisis, Plan) es uno de los sistemas más aceptados en el ámbito de la salud mental internacional por su claridad y concisión para registrar la evolución de los consultantes.'
                ]
            },
            {
                heading: 'Límites éticos y de responsabilidad',
                paragraphs: [
                    'Este contenido clínico es informativo y profesional; no sustituye la supervisión técnica especializada, la formación en registro clínico ni las normativas legales que rijan la salud de tu localidad.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Cuándo se debe escribir la nota clínica?',
                answer: 'Se aconseja redactarla inmediatamente después de terminar la sesión o al final del día clínico, para evitar la pérdida de detalles relevantes del proceso.'
            },
            {
                question: '¿Cómo ayuda SAPIHUM en el registro de mis notas?',
                answer: 'Ofrecemos formatos ágiles e indexables y formación en redacción clínica adaptada a distintos modelos terapéuticos.'
            }
        ],
        gatedResource: {
            assetKey: 'nota-clinica-psicologica',
            title: 'Plantilla de nota clínica psicológica',
            description: 'Formato editable estructurado basado en la metodología clínica SOAP para un registro ágil y completo.',
            benefits: [
                'Campos para registrar evolución, técnicas e intervenciones.',
                'Fácil de usar en formato de texto digital u hoja impresa.',
                'Ayuda a reducir el tiempo invertido en labores administrativas.'
            ],
            downloadUrl: '/api/organic-resources/nota-clinica-psicologica'
        },
        relatedAssets: [
            { label: 'Formato de Historia Clínica', href: '/recursos/formatos/historia-clinica-psicologica', type: 'resource_format' },
            { label: 'Formato de Nota de Evolución', href: '/recursos/formatos/nota-evolucion-psicologica', type: 'resource_format' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'nota-evolucion-psicologica',
        contentType: 'resource_format',
        sourceType: 'resource_format',
        title: 'Nota de evolución psicológica: formato y registro clínico',
        description: 'Aprende a redactar notas de evolución de forma sintética, rigurosa y alineada con los objetivos de tu plan de intervención terapéutico.',
        aiSummary: 'La nota de evolución psicológica registra los cambios sustanciales del paciente en relación con los objetivos terapéuticos fijados. Facilita la síntesis clínica intersesión.',
        topic: 'nota clinica',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Estructura clínica',
        ctaLabel: 'Explorar recursos',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['nota_clinica', 'formatos_clinicos', 'evaluacion_clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Diferencia entre nota clínica general y nota de evolución',
                paragraphs: [
                    'Mientras que una nota de sesión puede registrar detalles conversacionales breves, la nota de evolución busca documentar de forma estructurada los avances reales del consultante hacia las metas definidas al inicio de la psicoterapia.',
                    'Debe enfocarse en cambios de conducta observables, regulación emocional autopercibida, avances en la flexibilidad cognitiva y reducción sintomática reportada.'
                ],
                bullets: [
                    'Avance sobre el motivo de consulta principal.',
                    'Resumen del estado mental general y nivel de riesgo clínico.',
                    'Efectividad reportada de las técnicas implementadas en terapia.'
                ]
            },
            {
                heading: 'Recomendaciones profesionales de redacción',
                paragraphs: [
                    'Se recomienda redactar con vocabulario técnico preciso y libre de juicios de valor moral. Evita adjetivos subjetivos innecesarios e integra frases directas que sustenten tus hipótesis terapéuticas.'
                ]
            },
            {
                heading: 'Disclaimer profesional',
                paragraphs: [
                    'Este contenido es orientativo y profesional; no sustituye la supervisión especializada de casos clínicos complejos ni la asesoría legal sobre derecho a la salud en tu jurisdicción.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué hacer ante una crisis ocurrida en la sesión?',
                answer: 'Debe quedar registrada detalladamente en la nota de evolución, especificando las técnicas de contención empleadas y el plan de seguridad acordado.'
            },
            {
                question: '¿SAPIHUM cuenta con formatos para notas de evolución?',
                answer: 'Sí, proporcionamos plantillas editables y guías de redacción estructurada para facilitar la documentación de tu consulta.'
            }
        ],
        relatedAssets: [
            { label: 'Plantilla de Nota Clínica', href: '/recursos/formatos/nota-clinica-psicologica', type: 'resource_format' },
            { label: 'Formato de Plan Terapéutico', href: '/recursos/formatos/plan-terapeutico', type: 'resource_format' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'primera-entrevista-psicologica',
        contentType: 'resource_format',
        sourceType: 'resource_format',
        title: 'Formato de primera entrevista psicológica: guía y registro',
        description: 'Estructura la sesión de primer contacto con tus consultantes, asegurando el encuadre clínico y la alianza terapéutica.',
        aiSummary: 'El formato de primera entrevista para psicología guía al clínico a estructurar la sesión inicial de encuadre, recolectar datos relevantes del motivo de consulta y establecer el lazo empático de alianza.',
        topic: 'evaluacion clinica',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Encuadre profesional',
        ctaLabel: 'Explorar recursos',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['evaluacion_clinica', 'historia_clinica', 'practica_clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Los objetivos de la sesión inicial de primer contacto',
                paragraphs: [
                    'La primera entrevista es un momento sumamente delicado en terapia. No se limita a un interrogatorio rígido para rellenar una historia clínica, sino que representa el nacimiento de la alianza terapéutica.',
                    'El formato estructurado debe guiar al psicólogo a definir el encuadre ético, presentar el consentimiento informado de manera transparente, explorar el motivo de consulta prioritario y acordar las metas iniciales del proceso.'
                ],
                bullets: [
                    'Establecimiento de la alianza terapéutica y empatía clínica.',
                    'Presentación transparente del consentimiento informado y secreto profesional.',
                    'Exploración de antecedentes relevantes y motivo de consulta manifiesto.'
                ]
            },
            {
                heading: 'El encuadre terapéutico y administrativo',
                paragraphs: [
                    'Consiste en definir los límites claros del proceso: duración exacta de las sesiones, canal de comunicación oficial intersesiones, políticas claras de retraso y formas de pago aceptadas.'
                ]
            },
            {
                heading: 'Disclaimer ético',
                paragraphs: [
                    'Este contenido clínico es netamente informativo; no sustituye el criterio técnico particular, la supervisión de casos clínicos ni la formación clínica específica.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué hacer si el paciente no tiene claro su motivo de consulta?',
                answer: 'El terapeuta guiará la conversación explorando los disparadores situacionales recientes o el nivel de malestar emocional subjetivo para ayudar a formular metas claras.'
            },
            {
                question: '¿Cómo ayuda SAPIHUM en mis primeras entrevistas?',
                answer: 'A través de plantillas de entrevista estructurada y formación continua en evaluación y diagnóstico clínico basado en evidencia.'
            }
        ],
        relatedAssets: [
            { label: 'Formato de Historia Clínica', href: '/recursos/formatos/historia-clinica-psicologica', type: 'resource_format' },
            { label: 'Formato de Consentimiento Informado', href: '/recursos/formatos/consentimiento-informado-psicologico', type: 'resource_format' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'plan-terapeutico',
        contentType: 'resource_format',
        sourceType: 'resource_format',
        title: 'Formato de plan terapéutico: diseño y objetivos',
        description: 'Aprende a diseñar planes de tratamiento psicológico coherentes, estructurados y adaptados a las necesidades reales del paciente.',
        aiSummary: 'El plan terapéutico estructurado es un documento de trabajo que vincula la formulación del caso clínico con los objetivos del paciente, estableciendo técnicas precisas de intervención y criterios objetivos de alta.',
        topic: 'evaluacion clinica',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Estructura clínica',
        ctaLabel: 'Explorar recursos',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['evaluacion_clinica', 'practica_clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'El enlace entre la formulación y la acción clínica',
                paragraphs: [
                    'Un plan terapéutico sólido surge directamente de la hipótesis explicativa de la formulación de caso. Evita la improvisación en sesión y le da al consultante una sensación clara de rumbo y dirección.',
                    'El plan debe definir objetivos realistas a corto, mediano y largo plazo, detallando qué técnicas clínicas (TCC, ACT, DBT, etc.) se utilizarán para ayudar al paciente a lograr sus metas de forma efectiva.'
                ],
                bullets: [
                    'Jerarquización de metas basadas en el nivel de malestar o urgencia clínica.',
                    'Selección fundada de técnicas de intervención psicológica.',
                    'Indicadores claros de avance y criterios establecidos de alta terapéutica.'
                ]
            },
            {
                heading: 'La co-construcción de metas con el consultante',
                paragraphs: [
                    'Para maximizar la adherencia terapéutica, las metas no deben imponerse de manera rígida por el profesional. Discutir y consensuar los objetivos de trabajo con el paciente fortalece el compromiso y el avance del proceso.'
                ]
            },
            {
                heading: 'Disclaimer ético profesional',
                paragraphs: [
                    'Este contenido clínico es meramente orientativo; no sustituye la supervisión de casos complejos, el criterio especializado individual del terapeuta ni el consentimiento informado del paciente.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Se puede modificar el plan terapéutico?',
                answer: 'Sí, el plan terapéutico es un documento dinámico que se revisa periódicamente y se ajusta según la evolución o nuevas necesidades clínicas del paciente.'
            },
            {
                question: '¿Cómo estructurar indicadores de avance?',
                answer: 'Mediante la observación directa de conductas del paciente o el uso periódico de escalas estandarizadas de tamizaje (como GAD-7 o PHQ-9).'
            }
        ],
        relatedAssets: [
            { label: 'Guía de Formulación de Caso', href: '/guias/formulacion-de-caso-clinico', type: 'guide' },
            { label: 'Formato de Nota de Evolución', href: '/recursos/formatos/nota-evolucion-psicologica', type: 'resource_format' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'checklist-consulta-organizada',
        contentType: 'resource_format',
        sourceType: 'resource_format',
        title: 'Checklist para consulta psicológica organizada y profesional',
        description: 'Optimiza la logística interna de tu consultorio de psicología antes, durante y después de cada sesión con esta lista de control.',
        aiSummary: 'El checklist de consulta psicológica ayuda a ordenar las tareas logísticas, preparar los expedientes, revisar el encuadre clínico y documentar las notas de evolución sin cometer errores u omisiones administrativas.',
        topic: 'consulta privada',
        specialty: 'clinica',
        heroEyebrow: 'Recurso descargable',
        ctaLabel: 'Descargar checklist',
        intent: 'download_resource',
        actionType: 'resource_download',
        interestTags: ['formatos_clinicos', 'consulta_privada', 'herramientas_digitales', 'clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'La preparación previa a la sesión de terapia',
                paragraphs: [
                    'La improvisación en psicoterapia mina la confianza del consultante y desgasta la energía del clínico. Tener una rutina estructurada antes de que el paciente entre al consultorio físico o virtual es un pilar fundamental de la excelencia.',
                    'Esto incluye revisar la nota de la sesión anterior, preparar las hojas de trabajo del enfoque terapéutico y asegurarte de tener listo el consentimiento informado si se trata de un primer contacto.'
                ],
                bullets: [
                    'Lectura rápida de la nota e hipótesis diagnósticas de la sesión anterior.',
                    'Preparación del espacio (iluminación, ruido, ventilación o conexión de red).',
                    'Fichas de registro conductual u hojas de autoregistro impresas o digitales.'
                ]
            },
            {
                heading: 'El cierre de sesión y la labor administrativa',
                paragraphs: [
                    'Terminar la sesión implica registrar de inmediato las notas clínicas más importantes, programar la próxima cita en la agenda y archivar el expediente de forma segura cumpliendo con el secreto profesional.'
                ]
            },
            {
                heading: 'Disclaimer ético',
                paragraphs: [
                    'Este contenido clínico es estrictamente informativo y profesional; no sustituye la supervisión constante de casos, el juicio técnico del terapeuta ni las regulaciones normativas sanitarias locales.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Cuánto tiempo se recomienda dejar entre sesiones?',
                answer: 'Se aconseja dejar un margen mínimo de 10 a 15 minutos entre sesiones para redactar notas rápidas, descansar y prepararte para el siguiente caso.'
            },
            {
                question: '¿Cómo ayuda SAPIHUM con la organización de mi consulta?',
                answer: 'Te proveemos herramientas digitales, checklists interactivos y formaciones aplicadas que optimizan la gestión de tu consultorio.'
            }
        ],
        gatedResource: {
            assetKey: 'checklist-consulta-organizada',
            title: 'Checklist de consulta psicológica organizada',
            description: 'Lista de control interactiva para psicólogos que buscan ordenar y automatizar la logística diaria de su práctica clínica.',
            benefits: [
                'Paso a paso estructurado antes, durante y después de sesión.',
                'Consejos rápidos de resguardo de datos y secreto clínico.',
                'Formato editable listo para imprimir o usar en tablet/computadora.'
            ],
            downloadUrl: '/api/organic-resources/checklist-consulta-organizada'
        },
        relatedAssets: [
            { label: 'Guía para Organizar tu Práctica', href: '/guias/como-organizar-practica-clinica', type: 'guide' },
            { label: 'Plantilla de Nota Clínica', href: '/recursos/formatos/nota-clinica-psicologica', type: 'resource_format' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'terapia-cognitivo-conductual',
        contentType: 'approach',
        sourceType: 'approach',
        title: 'Terapia cognitivo conductual (TCC): principios y aplicaciones',
        description: 'Explora los fundamentos teóricos, técnicas Cardinales y el respaldo empírico del enfoque más extendido en la psicología clínica.',
        aiSummary: 'La Terapia Cognitivo-Conductual (TCC) es un enfoque psicoterapéutico basado en evidencia que vincula los pensamientos, emociones y conductas, orientado a resolver problemas prácticos del consultante en el presente.',
        topic: 'TCC',
        specialty: 'tcc',
        heroEyebrow: 'Enfoque terapéutico',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['tcc', 'formacion_continua', 'autores_psicologia'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: '¿Qué es la Terapia Cognitivo-Conductual?',
                paragraphs: [
                    'La Terapia Cognitivo-Conductual (TCC) es un modelo de intervención clínico estructurado, Directivo y orientado a la resolución de problemas actuales del paciente, a través de la modificación de patrones de pensamiento y conductas disfuncionales.',
                    'Se fundamenta en la premisa de que no son las situaciones en sí mismas las que causan malestar, sino la interpretación subjetiva y los significados sesgados que les asignamos.'
                ],
                bullets: [
                    'Reestructuración cognitiva de pensamientos automáticos negativos y distorsiones.',
                    'Activación conductual orientada al tratamiento de la depresión y la anhedonia.',
                    'Exposición gradual y técnicas de afrontamiento para trastornos de ansiedad.'
                ]
            },
            {
                heading: 'Sustento empírico de la TCC',
                paragraphs: [
                    'La TCC es el enfoque psicoterapéutico que cuenta con el mayor volumen de estudios clínicos controlados y respaldo científico para el tratamiento de trastornos como la depresión mayor, la ansiedad generalizada, el pánico y el TEPT.'
                ]
            },
            {
                heading: 'Disclaimer ético',
                paragraphs: [
                    'Este contenido clínico tiene un propósito exclusivamente educativo e informativo; no sustituye la psicoterapia individual ni el criterio clínico especializado de un psicólogo formado.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Cuánto dura un tratamiento con enfoque TCC?',
                answer: 'Suelen ser procesos relativamente breves y focalizados, que varían entre 12 y 24 sesiones dependiendo del motivo de consulta y la severidad clínica.'
            },
            {
                question: '¿Qué autores crearon la TCC?',
                answer: 'Sus principales pioneros fueron Aaron Beck con la terapia cognitiva y Albert Ellis con la terapia racional emotiva conductual.'
            }
        ],
        relatedAssets: [
            { label: 'Especialidad en TCC', href: '/especialidades/terapia-cognitivo-conductual', type: 'specialty' },
            { label: 'Biografía de Aaron Beck', href: '/autores/aaron-beck', type: 'author' },
            { label: 'Libros esenciales de TCC', href: '/libros/libros-de-terapia-cognitivo-conductual', type: 'book' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'terapia-sistemica',
        contentType: 'approach',
        sourceType: 'approach',
        title: 'Terapia sistémica familiar: fundamentos y técnicas',
        description: 'Comprende el análisis de las dinámicas familiares, patrones relacionales y el genograma como herramientas de intervención clínica.',
        aiSummary: 'La terapia sistémica familiar analiza las dinámicas de comunicación y los patrones de relación disfuncionales dentro de los sistemas humanos complejos, considerando al individuo como parte de una red interconectada.',
        topic: 'terapia sistemica',
        specialty: 'pareja_familia',
        heroEyebrow: 'Enfoque relacional',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['terapia_sistemica', 'pareja_familia', 'formacion_continua'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: '¿Qué es la terapia sistémica familiar?',
                paragraphs: [
                    'La terapia sistémica relacional descentra la atención del "síntoma individual" para comprenderlo dentro del contexto relacional del sistema familiar.',
                    'Postula que los cambios en un elemento de la familia repercutirán de forma inevitable en el equilibrio y funcionamiento del resto del sistema.'
                ],
                bullets: [
                    'Uso clínico del genograma digital y mapas relacionales detallados.',
                    'Detección de patrones de comunicación disfuncionales y triangulaciones.',
                    'Técnicas de reencuadre y prescripciones de comportamiento relacional.'
                ]
            },
            {
                heading: 'El genograma como recurso de evaluación',
                paragraphs: [
                    'El genograma clínico permite trazar de forma visual al menos tres generaciones de la familia, revelando patrones repetitivos de alianza, conflicto, abandono y dinámicas transgeneracionales de trauma.'
                ]
            },
            {
                heading: 'Disclaimer profesional',
                paragraphs: [
                    'Este contenido clínico tiene un carácter orientativo y de divulgación; no sustituye la psicoterapia especializada ni la supervisión clínica correspondiente.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Debe asistir toda la familia a la sesión?',
                answer: 'No necesariamente. Aunque la presencia de varios integrantes ayuda, se puede realizar psicoterapia con enfoque sistémico trabajando con un solo miembro del sistema.'
            },
            {
                question: '¿Qué especialidades de SAPIHUM se relacionan con este enfoque?',
                answer: 'Nuestra especialidad activa de Pareja y Familia ofrece recursos y formaciones completas basadas en el enfoque sistémico.'
            }
        ],
        relatedAssets: [
            { label: 'Especialidad en Pareja y Familia', href: '/especialidades/pareja-familia', type: 'specialty' },
            { label: 'Comunidad SAPIHUM', href: '/comunidad', type: 'community' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'terapia-humanista',
        contentType: 'approach',
        sourceType: 'approach',
        title: 'Terapia humanista centrada en la persona',
        description: 'Explora la empatía clínica, la aceptación incondicional y la congruencia como pilares fundamentales de la psicoterapia humanista.',
        aiSummary: 'La psicoterapia humanista centrada en la persona asume que todo individuo posee una tendencia actualizante innata al crecimiento y la autorrealización, favorecida por la actitud terapéutica adecuada.',
        topic: 'terapia humanista',
        specialty: 'clinica',
        heroEyebrow: 'Enfoque humanista',
        ctaLabel: 'Explorar recursos',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['autores_psicologia', 'formacion_continua', 'clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Las tres actitudes básicas del terapeuta rogeriano',
                paragraphs: [
                    'La terapia centrada en la persona, desarrollada por Carl Rogers, propone que el terapeuta no es una figura de autoridad que interpreta o aconseja, sino un facilitador del crecimiento interno del consultante.',
                    'El proceso de cambio terapéutico ocurre cuando el psicólogo demuestra sistemáticamente tres condiciones facilitadoras:'
                ],
                bullets: [
                    'Aceptación incondicional: Respeto y valoración del paciente sin emitir juicios morales.',
                    'Comprensión empática: Capacidad de percibir el mundo interno del paciente tal como él lo vive.',
                    'Congruencia o autenticidad: Coherencia ética y transparencia en la relación psicoterapéutica.'
                ]
            },
            {
                heading: 'La tendencia actualizante humana',
                paragraphs: [
                    'El enfoque humanista confía en el potencial de autorregulación del ser humano. El papel de la terapia es despejar las barreras impuestas por condiciones de valor externas que impiden el pleno desarrollo de la personalidad.'
                ]
            },
            {
                heading: 'Disclaimer profesional',
                paragraphs: [
                    'Este contenido clínico es informativo y educativo; no sustituye la consulta personalizada de salud mental, supervisión de casos ni asesoría legal correspondiente.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué diferencia a la terapia humanista del psicoanálisis?',
                answer: 'El enfoque humanista evita interpretar el inconsciente y se centra en la experiencia subjetiva consciente presente y en la capacidad de elección del consultante.'
            },
            {
                question: '¿Quién fundó el enfoque humanista?',
                answer: 'Sus principales fundadores fueron Carl Rogers y Abraham Maslow.'
            }
        ],
        relatedAssets: [
            { label: 'Biografía de Carl Rogers', href: '/autores/carl-rogers', type: 'author' },
            { label: 'Comunidad SAPIHUM', href: '/comunidad', type: 'community' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'psicoanalisis',
        contentType: 'approach',
        sourceType: 'approach',
        title: 'Psicoanálisis clínico: conceptos fundamentales y evolución',
        description: 'Revisa los conceptos del inconsciente, la transferencia, mecanismos de defensa y la transición hacia la psicoterapia psicodinámica.',
        aiSummary: 'El psicoanálisis clínico es un modelo psicoterapéutico que explora las fuerzas inconscientes, los conflictos internos infantiles reprimidos y la transferencia clínica para comprender la personalidad humana.',
        topic: 'psicoanalisis',
        specialty: 'clinica',
        heroEyebrow: 'Enfoque analítico',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['formacion_continua', 'clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'La exploración de los procesos inconscientes',
                paragraphs: [
                    'El psicoanálisis, desarrollado inicialmente por Sigmund Freud, se basa en la idea de que gran parte del comportamiento humano y de los síntomas neuróticos está gobernado por motivaciones inconscientes y conflictos de la infancia temprana.',
                    'El espacio terapéutico busca dar voz a esos contenidos reprimidos a través de metodologías como la asociación libre y la interpretación de la transferencia clínica.'
                ],
                bullets: [
                    'Asociación libre: Expresión libre del pensamiento sin censura moral.',
                    'Análisis de la transferencia y contratransferencia en la relación clínica.',
                    'Identificación de mecanismos de defensa inconscientes (p. ej., proyección, represión).'
                ]
            },
            {
                heading: 'La psicoterapia psicodinámica contemporánea',
                paragraphs: [
                    'En la actualidad, los modelos psicodinámicos han evolucionado hacia intervenciones más breves, focalizadas y con mayor interacción entre terapeuta y paciente, adaptándose a las necesidades de la práctica privada moderna.'
                ]
            },
            {
                heading: 'Disclaimer ético profesional',
                paragraphs: [
                    'Este contenido clínico es netamente de carácter informativo; no sustituye la supervisión técnica de casos, la formación especializada en psicoterapia psicodinámica ni la psicoterapia individual.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué es el fenómeno de la transferencia?',
                answer: 'Es el proceso inconsciente mediante el cual el paciente proyecta en la figura del psicólogo sentimientos, deseos y expectativas originadas en relaciones tempranas (p. ej., con los padres).'
            },
            {
                question: '¿Es eficaz el psicoanálisis moderno?',
                answer: 'Los estudios sobre psicoterapia psicodinámica demuestran su efectividad en la reducción sintomática y en la mejora de la personalidad a largo plazo.'
            }
        ],
        relatedAssets: [
            { label: 'Libros de Psicología Clínica', href: '/libros/mejores-libros-de-psicologia-clinica', type: 'book' },
            { label: 'Comunidad SAPIHUM', href: '/comunidad', type: 'community' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'act',
        contentType: 'approach',
        sourceType: 'approach',
        title: 'Terapia de aceptación y compromiso (ACT): bases y flexibilidad',
        description: 'Aprende a aplicar el modelo Hexaflex de flexibilidad psicológica, la defusión de pensamientos y la acción comprometida con tus valores.',
        aiSummary: 'La Terapia de Aceptación y Compromiso (ACT) es una psicoterapia de tercera generación orientada a incrementar la flexibilidad psicológica, promoviendo la aceptación y la defusión cognitiva.',
        topic: 'ACT',
        specialty: 'terapias_contextuales',
        heroEyebrow: 'Terapia contextual',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['act', 'terapias_contextuales', 'formacion_continua'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'El modelo Hexaflex de flexibilidad psicológica',
                paragraphs: [
                    'La Terapia de Aceptación y Compromiso (ACT) redefine la relación del consultante con su propio dolor. El objetivo no es eliminar el malestar subjetivo o los pensamientos negativos, sino aumentar la flexibilidad psicológica para vivir una vida con sentido.',
                    'Se estructura alrededor del Hexaflex, un modelo integrado por seis procesos psicológicos fundamentales:'
                ],
                bullets: [
                    'Aceptación activa frente a la evitación experiencial disfuncional.',
                    'Defusión cognitiva: Distanciarse de los pensamientos sin asumirlos como verdades absolutas.',
                    'Contacto con el momento presente (mindfulness) y el Yo-Contexto.',
                    'Valores personales y acción comprometida con los mismos.'
                ]
            },
            {
                heading: 'La Teoría de los Marcos Relacionales (RFT)',
                paragraphs: [
                    'ACT cuenta con un sólido fundamento científico experimental de base, sustentado en la Teoría de los Marcos Relacionales (RFT), que explica cómo el lenguaje humano moldea nuestras respuestas emocionales y de sufrimiento.'
                ]
            },
            {
                heading: 'Disclaimer ético profesional',
                paragraphs: [
                    'Este contenido clínico es informativo y profesional; no sustituye la supervisión clínica de casos, la formación de posgrado en ACT ni la psicoterapia individual.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué diferencia a ACT de la TCC tradicional?',
                answer: 'Mientras que la TCC tradicional busca debatir o cambiar el contenido de los pensamientos distorsionados, ACT busca cambiar nuestra relación con ellos mediante la aceptación y defusión.'
            },
            {
                question: '¿Quién es el creador de ACT?',
                answer: 'El principal creador e impulsor de la Terapia de Aceptación y Compromiso es Steven Hayes.'
            }
        ],
        relatedAssets: [
            { label: 'Especialidad en Contextuales', href: '/especialidades/terapias-contextuales', type: 'specialty' },
            { label: 'Biografía de Steven Hayes', href: '/autores/steven-hayes', type: 'author' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'dbt',
        contentType: 'approach',
        sourceType: 'approach',
        title: 'Terapia dialéctico conductual (DBT): regulación emocional',
        description: 'Conoce la intervención con mayor sustento científico para la desregulación emocional severa y el trastorno límite de la personalidad.',
        aiSummary: 'La Terapia Dialéctico Conductual (DBT) es un modelo clínico basado en evidencia que balancea la aceptación radical con el cambio conductual, ideal para el tratamiento de la desregulación emocional severa.',
        topic: 'DBT',
        specialty: 'regulacion_emocional',
        heroEyebrow: 'Regulación clínica',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['dbt', 'regulacion_emocional', 'formacion_continua'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'La dialéctica entre aceptación radical y cambio',
                paragraphs: [
                    'La Terapia Dialéctico Conductual (DBT), desarrollada por Marsha Linehan, integra la ciencia conductual aplicada con prácticas de atención plena del zen, para abordar el sufrimiento emocional severo.',
                    'El núcleo de DBT radica en la tensión dialéctica: el terapeuta ayuda al paciente a aceptarse radicalmente a sí mismo tal y como es en el presente, mientras trabaja activamente para modificar conductas disfuncionales de riesgo.'
                ],
                bullets: [
                    'Mapeo de habilidades DBT en regulación emocional y tolerancia al malestar.',
                    'Efectividad interpersonal: Habilidades de comunicación DEAR MAN y FAST.',
                    'Análisis en cadena para identificar antecedentes y conductas problema de riesgo.'
                ]
            },
            {
                heading: 'El entrenamiento en habilidades DBT',
                paragraphs: [
                    'Un tratamiento DBT estándar combina la psicoterapia individual enfocada en metas de seguridad, con grupos de entrenamiento de habilidades semanales orientados a dotar al paciente de recursos conductuales sólidos.'
                ]
            },
            {
                heading: 'Disclaimer profesional ético',
                paragraphs: [
                    'Este contenido clínico es informativo y educativo; no sustituye la supervisión técnica intensiva de casos, la terapia individual DBT de red de apoyo, ni la formación especializada certificada.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Para qué patologías es eficaz la DBT?',
                answer: 'Es el estándar de oro con mayor evidencia empírica para el Trastorno Límite de la Personalidad (TLP), autolesiones, ideación suicida y desregulación emocional severa.'
            },
            {
                question: '¿Qué especialidad activa de SAPIHUM cubre DBT?',
                answer: 'Nuestra especialidad activa de Regulación Emocional cuenta con amplias guías, formaciones y entrenamientos en DBT.'
            }
        ],
        relatedAssets: [
            { label: 'Especialidad en Regulación Emocional', href: '/especialidades/regulacion-emocional', type: 'specialty' },
            { label: 'Biografía de Marsha Linehan', href: '/autores/marsha-linehan', type: 'author' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'aaron-beck',
        contentType: 'author',
        sourceType: 'author',
        title: 'Aaron Beck: fundador de la terapia cognitiva',
        description: 'Descubre el legado, los aportes fundamentales y la trayectoria del creador de la terapia cognitiva de la depresión.',
        aiSummary: 'Aaron T. Beck fue un psiquiatra y psicoterapeuta pionero que revolucionó la salud mental al fundar la terapia cognitiva de la depresión, sentando las bases científicas de la Terapia Cognitivo-Conductual.',
        topic: 'autores de psicologia',
        specialty: 'tcc',
        heroEyebrow: 'Autor destacado',
        ctaLabel: 'Ver formaciones relacionadas',
        intent: 'explore_formation',
        actionType: 'guide_view',
        interestTags: ['autores_psicologia', 'tcc'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Quién fue Aaron Beck y su ruptura analítica',
                paragraphs: [
                    'Aaron Temkin Beck (1921–2021) se formó originalmente como psicoanalista en los años cincuenta. Al intentar validar empíricamente los postulados freudianos sobre la depresión, descubrió que los pacientes deprimidos experimentaban pensamientos automáticos rápidos y sesgados.'
                ]
            },
            {
                heading: 'Los aportes principales a la psicoterapia contemporánea',
                paragraphs: [
                    'Beck propuso la tríada cognitiva de la depresión (visión negativa del self, del mundo y del futuro) y describió las distorsiones cognitivas como el catastrofismo o la abstracción selectiva, estructurando un modelo de tratamiento breve y empíricamente sustentado.'
                ],
                bullets: [
                    'La conceptualización de la tríada cognitiva depresiva.',
                    'Definición de distorsiones cognitivas sistemáticas y esquemas nucleares de pensamiento.',
                    'El desarrollo del Inventario de Depresión de Beck (BDI-II), usado a nivel internacional.'
                ]
            },
            {
                heading: 'Disclaimer profesional',
                paragraphs: [
                    'Este contenido biográfico y conceptual es informativo y profesional; no sustituye la psicoterapia individual, supervisión técnica ni la lectura directa de sus obras científicas.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué libros de Beck son indispensables?',
                answer: '"Terapia cognitiva de la depresión" y "Terapia cognitiva de los trastornos de personalidad" son dos obras cardinales en la psicología clínica.'
            },
            {
                question: '¿Cómo se conecta Beck con SAPIHUM?',
                answer: 'A través de nuestra oferta de formación y especialización en Terapia Cognitivo-Conductual de alta rigurosidad.'
            }
        ],
        relatedAssets: [
            { label: 'Terapia Cognitivo Conductual', href: '/enfoques/terapia-cognitivo-conductual', type: 'approach' },
            { label: 'Especialidad en TCC', href: '/especialidades/terapia-cognitivo-conductual', type: 'specialty' }
        ],
        schemaTypes: ['Person', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'albert-ellis',
        contentType: 'author',
        sourceType: 'author',
        title: 'Albert Ellis: creador de la TREC',
        description: 'Conoce la vida y el legado del creador de la Terapia Racional Emotiva Conductual (TREC) y su modelo A-B-C.',
        aiSummary: 'Albert Ellis fue un psicoterapeuta cognitivo pionero, famoso por crear la Terapia Racional Emotiva Conductual (TREC), desafiando las creencias irracionales de los consultantes de forma directa.',
        topic: 'autores de psicologia',
        specialty: 'tcc',
        heroEyebrow: 'Autor destacado',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'guide_view',
        interestTags: ['autores_psicologia', 'tcc'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'El modelo conductual de Albert Ellis',
                paragraphs: [
                    'Albert Ellis (1913–2007) fundó la Terapia Racional Emotiva Conductual (TREC) a mediados de los años cincuenta. Postuló que las perturbaciones emocionales provienen de un conjunto de ideas y creencias irracionales que el individuo sostiene rígidamente sobre sí mismo y el entorno.'
                ]
            },
            {
                heading: 'El modelo A-B-C-D-E en psicoterapia',
                paragraphs: [
                    'Su modelo conceptual más influyente explica que un evento activador (A) no causa directamente una consecuencia emocional o conductual (C), sino que esta es generada por el sistema de creencias (B). La terapia se enfoca en debatir (D) estas ideas y generar nuevos efectos filosóficos (E).'
                ],
                bullets: [
                    'Concepto de las tres demandas absolutistas infantiles ("debo ser perfecto", "deben tratarme bien").',
                    'Detección y debate dialéctico socrático directo de pensamientos distorsionados.',
                    'Fomento sistemático de la autoaceptación incondicional racional.'
                ]
            },
            {
                heading: 'Disclaimer conceptual profesional',
                paragraphs: [
                    'Este contenido es informativo y educativo; no sustituye la supervisión psicoterapéutica especializada ni el diagnóstico clínico personalizado.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué diferencia a la TREC de la terapia cognitiva de Beck?',
                answer: 'La TREC de Ellis suele ser más directa, activa e inquisitiva sobre las demandas filosóficas profundas y absolutistas del paciente.'
            },
            {
                question: '¿Qué lecturas de Ellis son recomendables?',
                answer: 'Su obra "Razón y emoción en psicoterapia" es una excelente introducción teórica para clínicos.'
            }
        ],
        relatedAssets: [
            { label: 'Terapia Cognitivo Conductual', href: '/enfoques/terapia-cognitivo-conductual', type: 'approach' },
            { label: 'Formaciones SAPIHUM', href: '/formaciones', type: 'formation' }
        ],
        schemaTypes: ['Person', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'carl-rogers',
        contentType: 'author',
        sourceType: 'author',
        title: 'Carl Rogers: pionero del humanismo',
        description: 'Conoce los aportes y la filosofía de uno de los psicólogos más influyentes del siglo XX y creador de la terapia humanista.',
        aiSummary: 'Carl Rogers fue el fundador de la psicoterapia humanista centrada en el cliente. Propuso que la calidad de la relación y las actitudes del terapeuta son los verdaderos agentes del cambio clínico.',
        topic: 'autores de psicologia',
        specialty: 'clinica',
        heroEyebrow: 'Autor destacado',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'guide_view',
        interestTags: ['autores_psicologia', 'comunidad'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Carl Rogers y la relación terapéutica facilitadora',
                paragraphs: [
                    'Carl Ransom Rogers (1902–1987) cambió las reglas del consultorio de psicología al proponer que el terapeuta debe abdicar del rol directivo de experto de la mente de otros.',
                    'Propuso que la psicoterapia debe brindar una atmósfera relacional libre de juicio moral donde el paciente pueda recuperar su tendencia innata al crecimiento y la coherencia interna.'
                ]
            },
            {
                heading: 'Aportes a la investigación clínica de resultados',
                paragraphs: [
                    'Rogers fue el primer terapeuta en grabar sistemáticamente sesiones clínicas de psicoterapia para investigar empíricamente qué variables de interacción interpersonal facilitaban el cambio terapéutico duradero en los pacientes.'
                ],
                bullets: [
                    'Introducción del término "Cliente" o "Consultante" en lugar de "Paciente" para democratizar la relación.',
                    'El concepto de congruencia y autoaceptación existencial fluida.',
                    'Estudios científicos empíricos pioneros sobre el proceso psicoterapéutico.'
                ]
            },
            {
                heading: 'Disclaimer profesional educativo',
                paragraphs: [
                    'Este contenido biográfico y profesional es de carácter exclusivamente informativo y no sustituye la formación clínica, la supervisión de casos clínicos ni el juicio profesional.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué es el reflejo empático rogeriano?',
                answer: 'Una técnica verbal donde el terapeuta devuelve al consultante los sentimientos implícitos en sus palabras para facilitar la toma de conciencia emocional.'
            },
            {
                question: '¿Cómo se conecta Rogers con SAPIHUM?',
                answer: 'A través de nuestras formaciones enfocadas en el establecimiento ético y efectivo de la alianza de ayuda psicoterapéutica.'
            }
        ],
        relatedAssets: [
            { label: 'Terapia Humanista', href: '/enfoques/terapia-humanista', type: 'approach' },
            { label: 'Comunidad SAPIHUM', href: '/comunidad', type: 'community' }
        ],
        schemaTypes: ['Person', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'marsha-linehan',
        contentType: 'author',
        sourceType: 'author',
        title: 'Marsha Linehan: creadora de la DBT',
        description: 'Descubre la historia, los conceptos cardinales y la trascendencia científica de la creadora del enfoque dialéctico conductual.',
        aiSummary: 'Marsha M. Linehan es la psicóloga clínica pionera que desarrolló la Terapia Dialéctico Conductual (DBT) para abordar efectivamente a pacientes con trastorno límite de la personalidad y desregulación emocional severa.',
        topic: 'autores de psicologia',
        specialty: 'regulacion_emocional',
        heroEyebrow: 'Autor destacado',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'guide_view',
        interestTags: ['autores_psicologia', 'dbt', 'regulacion_emocional'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'La trayectoria y el enfoque dialéctico conductual',
                paragraphs: [
                    'Marsha Linehan (1943) desarrolló la Terapia Dialéctico Conductual (DBT) al comprobar que las técnicas cognitivo-conductuales tradicionales generaban frustración y resistencia en pacientes con ideación suicida y desregulación afectiva extrema.',
                    'Su propuesta unifica el rigor de la ciencia conductual con la práctica de aceptación del budismo zen, conformando un sistema de validación y cambio de conducta equilibrado.'
                ]
            },
            {
                heading: 'Los aportes al tratamiento de la desregulación severa',
                paragraphs: [
                    'Su modelo estructurado en habilidades (tolerancia al malestar, efectividad interpersonal, regulación emocional y atención plena) cambió la historia de los tratamientos clínicos de salud mental para los trastornos más severos de personalidad.'
                ],
                bullets: [
                    'Creación y validación empírica internacional de la Terapia Dialéctico Conductual (DBT).',
                    'Integración de la dialéctica aceptación-cambio en terapia individual y de grupo.',
                    'Estructuras claras de análisis en cadena conductual para la prevención de conductas suicidas.'
                ]
            },
            {
                heading: 'Disclaimer ético y profesional',
                paragraphs: [
                    'Este contenido conceptual y biográfico es puramente informativo; no sustituye la supervisión técnica especializada, la psicoterapia de apoyo ni la formación intensiva avalada en DBT.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué libro autobiográfico de Linehan es sugerido?',
                answer: 'Su autobiografía "Construir una vida que valga la pena vivir" explica su propia historia personal y el desarrollo ético de la DBT.'
            },
            {
                question: '¿Cómo estudiar DBT en SAPIHUM?',
                answer: 'Nuestra especialidad activa de Regulación Emocional cuenta con temarios, formaciones y sesiones clínicas basadas en DBT.'
            }
        ],
        relatedAssets: [
            { label: 'Terapia Dialéctico Conductual', href: '/enfoques/dbt', type: 'approach' },
            { label: 'Especialidad en Regulación Emocional', href: '/especialidades/regulacion-emocional', type: 'specialty' }
        ],
        schemaTypes: ['Person', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'steven-hayes',
        contentType: 'author',
        sourceType: 'author',
        title: 'Steven Hayes: pionero de ACT',
        description: 'Conoce los aportes, la trayectoria y el sustento teórico de la flexibildad psicológica propuestos por el cocreador de la terapia de aceptación y compromiso.',
        aiSummary: 'Steven C. Hayes es un psicólogo clínico e investigador de gran relevancia mundial, desarrollador de la Terapia de Aceptación y Compromiso (ACT) y la Teoría de los Marcos Relacionales (RFT).',
        topic: 'autores de psicologia',
        specialty: 'terapias_contextuales',
        heroEyebrow: 'Autor destacado',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'guide_view',
        interestTags: ['autores_psicologia', 'act', 'terapias_contextuales'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Steven Hayes y la revolución contextual',
                paragraphs: [
                    'Steven C. Hayes (1948) lideró la transición hacia las terapias de tercera generación a través del análisis funcional de la conducta y la integración de la aceptación y la defusión en la práctica psicoterapéutica.',
                    'Hayes propone que la rigidez psicológica (intento obsesivo de evadir el malestar emocional) es la causa principal de la psicopatología y del sufrimiento humano disfuncional.'
                ]
            },
            {
                heading: 'Aportes a la Teoría de los Marcos Relacionales (RFT)',
                paragraphs: [
                    'Su labor académica ha proporcionado bases empíricas sólidas sobre cómo funciona el lenguaje, la cognición y el self en psicología a través de la Teoría de Marcos Relacionales (RFT).'
                ],
                bullets: [
                    'Cocreador del modelo Hexaflex de flexibilidad psicológica en ACT.',
                    'Desarrollador de la Teoría de Marcos Relacionales (RFT) aplicados a la clínica.',
                    'Autor de más de 40 libros de investigación científica sobre psicología del comportamiento.'
                ]
            },
            {
                heading: 'Disclaimer profesional y ético',
                paragraphs: [
                    'Este contenido de carácter biográfico y conceptual es netamente informativo; no sustituye la supervisión técnica de casos clínicos, el estudio científico directo, ni la psicoterapia.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué libro de Hayes es ideal para iniciar?',
                answer: '"Sal de tu mente, entra en tu vida" es una excelente lectura práctica e introductoria del enfoque ACT.'
            },
            {
                question: '¿Cómo conectarse con ACT en SAPIHUM?',
                answer: 'Contamos con una especialidad activa de Terapias Contextuales que aborda a profundidad el modelo ACT de Steven Hayes.'
            }
        ],
        relatedAssets: [
            { label: 'Terapia de Aceptación y Compromiso', href: '/enfoques/act', type: 'approach' },
            { label: 'Especialidad en Contextuales', href: '/especialidades/terapias-contextuales', type: 'specialty' }
        ],
        schemaTypes: ['Person', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'mejores-libros-de-psicologia-clinica',
        contentType: 'book',
        sourceType: 'book',
        title: 'Los mejores libros de psicología clínica para profesionales',
        description: 'Revisión crítica y comentada de textos indispensables sobre evaluación diagnóstica, psicopatología y tratamientos con evidencia empírica.',
        aiSummary: 'Los libros esenciales de psicología clínica ayudan a los terapeutas a consolidar su marco de trabajo teórico-práctico, a estructurar el diagnóstico y a aplicar tratamientos psicológicos con sólido respaldo científico.',
        topic: 'libros de psicologia',
        specialty: 'clinica',
        heroEyebrow: 'Ruta de lectura',
        ctaLabel: 'Unirme a la comunidad',
        intent: 'join_community',
        actionType: 'guide_view',
        interestTags: ['libros_psicologia', 'formacion_continua', 'clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Lecturas indispensables en psicopatología y diagnóstico',
                paragraphs: [
                    'La bibliografía científica en salud mental es inmensa. Sin embargo, existen manuales de referencia obligatoria que todo clínico serio debe conservar en su biblioteca profesional.',
                    'Un clínico ordenado requiere bases sólidas de diagnóstico diferencial e historia clínica que trasciendan el mecanicismo de los manuales estadísticos tradicionales.'
                ],
                bullets: [
                    'Manuales diagnósticos de referencia clínica internacional (DSM-5-TR / CIE-11).',
                    'Tratados clásicos de psicopatología descriptiva y fenomenología.',
                    'Textos de formulación clínica y diseño de planes de tratamiento.'
                ]
            },
            {
                heading: 'Rutas de formación académica complementaria',
                paragraphs: [
                    'Los libros constituyen la base del conocimiento técnico, pero este debe cobrar vida a través de la discusión en comunidad y la formación guiada por docentes con amplia experiencia clínica de campo.'
                ]
            },
            {
                heading: ' disclaimer ético y de derechos de autor',
                paragraphs: [
                    'Este contenido representa una recomendación y reseña crítica profesional de textos de referencia de venta autorizada; SAPIHUM promueve los derechos de autor y no facilita descargas ilegales de material pirata de ningún tipo.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué manual de tratamientos basados en evidencia recomiendan?',
                answer: 'El "Manual de técnicas de terapia y modificación de conducta" de Vicente Caballo sigue siendo una excelente referencia en castellano.'
            },
            {
                question: '¿Cómo ayuda SAPIHUM con mis lecturas?',
                answer: 'A través de nuestro club de lectura clínica, comunidad y formaciones periódicas que desmenuzan la teoría aplicada de estos textos.'
            }
        ],
        relatedAssets: [
            { label: 'Libros de TCC', href: '/libros/libros-de-terapia-cognitivo-conductual', type: 'book' },
            { label: 'Libros para Recién Egresados', href: '/libros/libros-para-psicologos-recien-egresados', type: 'book' }
        ],
        schemaTypes: ['Book', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'libros-de-terapia-cognitivo-conductual',
        contentType: 'book',
        sourceType: 'book',
        title: 'Libros esenciales de terapia cognitivo conductual (TCC)',
        description: 'Descubre los manuales teóricos, guías de práctica y cuadernos de trabajo que todo terapeuta con enfoque cognitivo-conductual debe estudiar.',
        aiSummary: 'Guía de libros recomendados sobre Terapia Cognitivo-Conductual (TCC). Reseña manuales de Aaron Beck, Judith Beck y protocolos clínicos empíricos estructurados.',
        topic: 'libros de TCC',
        specialty: 'tcc',
        heroEyebrow: 'Ruta de lectura',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'guide_view',
        interestTags: ['libros_psicologia', 'tcc'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Manuales cardinales de la terapia cognitiva',
                paragraphs: [
                    'Para dominar la TCC es vital estudiar directamente las fuentes teóricas y los protocolos de intervención validados.',
                    'La lectura analítica de guías clínicas paso a paso sobre reestructuración cognitiva y exposición gradual te brindará la seguridad técnica indispensable en sesión.'
                ],
                bullets: [
                    'Obras de Aaron T. Beck sobre depresión y trastornos de la personalidad.',
                    'El manual de Judith Beck sobre "Terapia Cognitiva: Conceptos básicos y más allá".',
                    'Protocolos estructurados de tratamientos eficaces para trastornos específicos.'
                ]
            },
            {
                heading: 'El complemento práctico clínico',
                paragraphs: [
                    'Ningún libro puede reemplazar el valor del análisis clínico grupal de casos, el modelado terapéutico en vivo y la supervisión de un clínico experto.'
                ]
            },
            {
                heading: 'Disclaimer ético editorial',
                paragraphs: [
                    'Este contenido clínico y educativo es informativo; respeta la propiedad intelectual y los derechos de autor de las obras reseñadas.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Judith Beck es hija de Aaron Beck?',
                answer: 'Sí, Judith Beck es una destacada psicóloga clínica que sistematizó el legado de su padre y fundó el Instituto Beck de Terapia Cognitiva.'
            },
            {
                question: '¿Qué especialidad cubre estos textos en SAPIHUM?',
                answer: 'Nuestra especialidad activa en Terapia Cognitivo-Conductual ofrece formaciones enlazadas con el temario y la teoría de estos autores.'
            }
        ],
        relatedAssets: [
            { label: 'Terapia Cognitivo Conductual', href: '/enfoques/terapia-cognitivo-conductual', type: 'approach' },
            { label: 'Especialidad en TCC', href: '/especialidades/terapia-cognitivo-conductual', type: 'specialty' }
        ],
        schemaTypes: ['Book', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'libros-para-psicologos-recien-egresados',
        contentType: 'book',
        sourceType: 'book',
        title: 'Libros para psicólogos recién egresados y nuevos clínicos',
        description: 'Una selección de lecturas prácticas diseñadas para guiarte en el inicio de tu consulta privada y el desarrollo ético de tu profesión.',
        aiSummary: 'Selección comentada de libros de psicología para recién egresados y terapeutas noveles. Aborda el encuadre clínico, las dudas éticas iniciales y la estructura de la consulta.',
        topic: 'libros de psicologia',
        specialty: 'clinica',
        heroEyebrow: 'Ruta de lectura',
        ctaLabel: 'Unirme a la comunidad',
        intent: 'join_community',
        actionType: 'guide_view',
        interestTags: ['libros_psicologia', 'consulta_privada', 'comunidad', 'clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Superar la inseguridad y estructurar la primera sesión',
                paragraphs: [
                    'El paso de la universidad a la práctica clínica autónoma suele provocar lo que comúnmente llamamos el "síndrome del impostor". Los libros que abordan el quehacer diario del terapeuta, sus temores éticos y las dudas prácticas son de gran valor en esta etapa.',
                    'Elegir libros orientados al encuadre clínico riguroso te ayudará a sortear los errores comunes y a establecer límites profesionales claros con tus primeros pacientes.'
                ],
                bullets: [
                    'Manuales prácticos sobre el ejercicio y el encuadre terapéutico.',
                    'Textos sobre el autocuidado ético del psicólogo clínico.',
                    'Guías breves sobre redacción y elaboración de notas clínicas de consulta.'
                ]
            },
            {
                heading: 'La supervisión clínica como eje de crecimiento',
                paragraphs: [
                    'Leer libros clínicos aporta teoría, pero debatir tus casos reales bajo la tutela de supervisores expertos es la verdadera garantía de un crecimiento profesional ético e impecable.'
                ]
            },
            {
                heading: 'Disclaimer ético profesional',
                paragraphs: [
                    'Este contenido es meramente orientativo; no sustituye la supervisión técnica obligatoria de tus casos clínicos ni la formación de posgrado especializada.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué libro de Irvin Yalom recomiendan?',
                answer: '"El don de la terapia" es una lectura indispensable y bellamente escrita para nuevos psicoterapeutas.'
            },
            {
                question: '¿SAPIHUM cuenta con acompañamiento para nuevos egresados?',
                answer: 'Sí, a través de nuestra comunidad profesional, grupos de supervisión y programas estructurados para el despegue de la práctica privada.'
            }
        ],
        relatedAssets: [
            { label: 'Guía para Conseguir Pacientes', href: '/guias/como-conseguir-pacientes-como-psicologo', type: 'guide' },
            { label: 'Comunidad SAPIHUM', href: '/comunidad', type: 'community' }
        ],
        schemaTypes: ['Book', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'especialidades-de-la-psicologia',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Especialidades de la psicología: ramas y salidas',
        description: 'Analiza las diferentes ramas de especialización de la psicología clínica, forense y social y sus horizontes profesionales.',
        aiSummary: 'Guía descriptiva de las especialidades activas y áreas aplicadas de la psicología. Detalla los campos laboral, académico y de especialización profesional.',
        topic: 'especialidades de la psicologia',
        specialty: 'clinica',
        heroEyebrow: 'Ruta profesional',
        ctaLabel: 'Ver formaciones',
        intent: 'evaluate_membership',
        actionType: 'commercial_cta',
        interestTags: ['formacion_continua', 'consulta_privada', 'comunidad', 'clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Las principales ramas aplicadas en el mercado profesional',
                paragraphs: [
                    'La psicología contemporánea trasciende por mucho la clínica tradicional. Para tener éxito y ejercer con rigor científico, es vital conocer los alcances e incumbencias de cada especialidad.',
                    'Ya sea en el ámbito jurídico-forense, educativo, organizacional o de la neuropsicología, cada rama cuenta con metodologías diagnósticas y regulaciones propias.'
                ],
                bullets: [
                    'Psicología Clínica: Evaluación, diagnóstico y tratamiento psicoterapéutico.',
                    'Psicología Forense y Peritaje: Rigor científico al servicio de la justicia y los tribunales.',
                    'Neuropsicología y Rehabilitación Cognitiva: Vínculo entre neurociencia y clínica.'
                ]
            },
            {
                heading: 'La ruta de crecimiento en SAPIHUM',
                paragraphs: [
                    'En nuestra plataforma estructuramos las formaciones de forma modular, permitiéndote transitar desde la membresía general de actualización profesional, hasta especializaciones clínicas avanzadas de alto impacto.'
                ]
            },
            {
                heading: 'Disclaimer normativo',
                paragraphs: [
                    'Este contenido de orientación profesional es de carácter puramente informativo; cada país tiene sus propias regulaciones de acreditación y títulos oficiales de psicología.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué especialidades son más demandadas?',
                answer: 'La evaluación diagnóstica, la terapia de pareja y familia y el abordaje de trastornos del estado de ánimo (ansiedad y depresión).'
            },
            {
                question: '¿Cómo me ayuda SAPIHUM a elegir especialidad?',
                answer: 'Ofreciéndote temarios abiertos, eventos introductorios y una red de supervisores que te guían en tu toma de decisiones.'
            }
        ],
        relatedAssets: [
            { label: 'Especialidades Activas', href: '/especialidades', type: 'specialty' },
            { label: 'Membresía Profesional SAPIHUM', href: '/membresia', type: 'specialty' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'comunidad-profesional-para-psicologos',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Comunidad profesional para psicólogos: por qué unirse',
        description: 'Reduce el aislamiento de la práctica clínica independiente y eleva tus estándares profesionales perteneciendo a una red de colegas éticos.',
        aiSummary: 'La pertenencia a una comunidad activa de psicología ayuda a los profesionales a mitigar el aislamiento, supervisar casos de manera segura, compartir derivaciones y mantenerse actualizados.',
        topic: 'comunidad profesional',
        specialty: 'supervision_clinica',
        heroEyebrow: 'Ecosistema profesional',
        ctaLabel: 'Registrarme gratis',
        intent: 'join_community',
        actionType: 'guide_view',
        interestTags: ['comunidad', 'consulta_privada', 'supervision_clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'Mitigar el aislamiento clínico en la práctica privada',
                paragraphs: [
                    'El ejercicio autónomo de la psicoterapia suele transcurrir en la soledad del consultorio. Estar frente a dilemas éticos o de diagnóstico complejo sin una red de soporte profesional puede incrementar radicalmente el estrés del terapeuta.',
                    'Pertenecer a una comunidad activa de colegas serios te permite debatir ideas bajo marcos de respeto, mantener un autocuidado emocional adecuado y cultivar derivaciones cruzadas de pacientes de forma sumamente ética.'
                ],
                bullets: [
                    'Supervisión grupal y foros técnicos de discusión sobre casos complejos.',
                    'Derivaciones profesionales verificadas basadas en la especialidad y el código ético.',
                    'Actualización constante en normativas, herramientas de gestión y metodologías.'
                ]
            },
            {
                heading: 'El crecimiento colaborativo continuo',
                paragraphs: [
                    'El aprendizaje en salud mental no termina en el posgrado. El intercambio cotidiano de artículos científicos, la recomendación de lecturas y la discusión técnica refinan tu criterio clínico sesión tras sesión.'
                ]
            },
            {
                heading: 'Disclaimer ético profesional',
                paragraphs: [
                    'Esta guía comunitaria e informativa es de divulgación; no sustituye la supervisión técnica oficial de tus casos clínicos ni la formación clínica correspondiente.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué requisitos hay para unirse a la comunidad de SAPIHUM?',
                answer: 'Ser graduado, estudiante de psicología de últimos semestres o profesional de la salud mental afín, con un firme compromiso por el ejercicio ético.'
            },
            {
                question: '¿Es de registro gratuito?',
                answer: 'Sí, contamos con un plan de registro gratuito para que explores y asistas a eventos comunitarios y una membresía de acceso total.'
            }
        ],
        relatedAssets: [
            { label: 'Guía para Conseguir Pacientes', href: '/guias/como-conseguir-pacientes-como-psicologo', type: 'guide' },
            { label: 'Comunidad SAPIHUM', href: '/comunidad', type: 'community' }
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'formacion-continua-para-psicologos',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Formación continua para psicólogos y actualización',
        description: 'Conoce la importancia ética y el impacto clínico de mantener una formación continua rigurosa y fundamentada en la evidencia.',
        aiSummary: 'La actualización profesional continua para psicoterapeutas asegura la aplicación de tratamientos efectivos basados en la ciencia del comportamiento, disminuyendo la iatrogenia clínica.',
        topic: 'formacion continua',
        specialty: 'clinica',
        heroEyebrow: 'Actualización clínica',
        ctaLabel: 'Ver formaciones',
        intent: 'explore_formation',
        actionType: 'commercial_cta',
        interestTags: ['formacion_continua', 'practica_clinica', 'clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'El deber ético de la actualización en psicología',
                paragraphs: [
                    'La psicología clínica es una disciplina en constante evolución científica. Los tratamientos de primera elección y las guías de práctica clínica de referencia se actualizan periódicamente en base a nuevos hallazgos experimentales.',
                    'Elegir formaciones con sólida rigurosidad científica no solo eleva tu estatus profesional y tus ingresos, sino que representa la mayor garantía de cuidado para la salud y el bienestar de tus consultantes.'
                ],
                bullets: [
                    'Cursos y diplomados enfocados en tratamientos con respaldo empírico.',
                    'Estudio sistemático de guías clínicas internacionales de salud mental (p. ej., guías NICE, APA).',
                    'Supervisión y actualización técnica en el manejo de riesgos complejos en sesión.'
                ]
            },
            {
                heading: 'La modularidad de las formaciones en SAPIHUM',
                paragraphs: [
                    'Nuestras rutas de aprendizaje están diseñadas de forma modular para adaptarse a los tiempos del terapeuta activo. Combinan la teoría a tu propio ritmo con talleres interactivos en vivo centrados en la práctica clínica real.'
                ]
            },
            {
                heading: 'Disclaimer ético normativo',
                paragraphs: [
                    'Este contenido de divulgación profesional es informativo; no sustituye los planes de estudio universitarios de grado ni las licencias oficiales de ejercicio sanitario de cada país.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Qué certificaciones ofrece SAPIHUM?',
                answer: 'Ofrecemos constancias de participación con registro de horas y valor curricular integrados en tu expediente profesional de membresía.'
            },
            {
                question: '¿Puedo estudiar varias especialidades a la vez?',
                answer: 'Sí, nuestra estructura modular permite el acceso a múltiples formaciones y recursos multidisciplinarios.'
            }
        ],
        relatedAssets: [
            { label: 'Especialidades Clínicas', href: '/especialidades', type: 'specialty' },
            { label: 'Explorar Formaciones', href: '/formaciones', type: 'formation' }
        ],
        schemaTypes: ['Course', 'BreadcrumbList', 'FAQPage']
    },
    {
        slug: 'herramientas-digitales-para-psicologos',
        contentType: 'tool',
        sourceType: 'tool',
        title: 'Herramientas digitales para psicólogos y consulta',
        description: 'Optimiza la gestión diaria de tu práctica clínica mediante telepsicología, expedientes digitales cifrados e inteligencia artificial.',
        aiSummary: 'El checklist de herramientas digitales ayuda a psicólogos a implementar telepsicología segura, agilizar la agenda de consulta, automatizar recordatorios y usar IA ética en sus resúmenes clínicos.',
        topic: 'herramientas digitales',
        specialty: 'clinica',
        heroEyebrow: 'Recurso premium',
        ctaLabel: 'Descargar checklist',
        intent: 'download_resource',
        actionType: 'resource_download',
        interestTags: ['herramientas_digitales', 'ia_para_psicologos', 'consulta_privada', 'clinica'],
        publishedAt: '2026-06-01',
        updatedAt: '2026-06-01',
        sections: [
            {
                heading: 'La digitalización ética del consultorio psicológico',
                paragraphs: [
                    'La tecnología digital ofrece posibilidades inmensas para hacer más eficiente el consultorio de psicología, liberando tiempo administrativo que el terapeuta puede dedicar a la labor clínica o a su desarrollo personal.',
                    'Sin embargo, esta digitalización debe ir acompañada de un estricto cuidado por el secreto profesional y la protección de datos personales confidenciales de salud mental.'
                ],
                bullets: [
                    'Telepsicología encriptada de extremo a extremo que proteja la privacidad.',
                    'Software de expedientes clínicos que cumpla con regulaciones sanitarias oficiales.',
                    'Asistentes de Inteligencia Artificial para la transcripción y redacción ágil de notas clínicas bajo anonimato del paciente.'
                ]
            },
            {
                heading: 'Uso de Inteligencia Artificial en psicología',
                paragraphs: [
                    'La IA representa un coequipero de gran valor para redactar y estructurar resúmenes o notas SOAP, siempre que se garantice que ningún dato que identifique directamente al paciente sea compartido con modelos de lenguaje externos.'
                ]
            },
            {
                heading: 'Límites éticos y disclaimer',
                paragraphs: [
                    'Este contenido descriptivo y tecnológico es informativo y profesional; no sustituye la supervisión técnica clínica, la formación académica en psicoterapia ni la asesoría legal sobre protección de datos de tu localidad.'
                ]
            }
        ],
        faqs: [
            {
                question: '¿Es seguro usar Zoom o WhatsApp para videoconsultas?',
                answer: 'Se recomienda usar plataformas de videollamada específicas que cumplan con encriptación avanzada de datos sanitarios para resguardar el secreto clínico.'
            },
            {
                question: '¿Cómo ayuda SAPIHUM con la digitalización?',
                answer: 'Ofrecemos guías de software clínico, plantillas y formación continua en la implementación ética de tecnología y de IA en salud mental.'
            }
        ],
        gatedResource: {
            assetKey: 'herramientas-digitales-para-psicologos',
            title: 'Checklist de herramientas digitales para psicólogos',
            description: 'Lista de control en formato plantilla con los requerimientos técnicos indispensables y las herramientas recomendadas para un consultorio digital eficiente y seguro.',
            benefits: [
                'Herramientas seleccionadas por su cumplimiento ético y de privacidad.',
                'Checklist de configuración segura de telepsicología.',
                'Recomendaciones de IA ética para redactar y sistematizar notas clínicas.'
            ],
            downloadUrl: '/api/organic-resources/herramientas-digitales-para-psicologos'
        },
        relatedAssets: [
            { label: 'Guía para Organizar tu Práctica', href: '/guias/como-organizar-practica-clinica', type: 'guide' },
            { label: 'Checklist de Consulta Organizada', href: '/recursos/formatos/checklist-consulta-organizada', type: 'resource_format' }
        ],
        schemaTypes: ['SoftwareApplication', 'BreadcrumbList', 'FAQPage']
    }
]
