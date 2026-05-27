'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LegalSection {
    id: string
    title: string
    shortTitle: string
}

const sections: LegalSection[] = [
    { id: 'introduccion', title: '1. Introducción y Aceptación de los Términos', shortTitle: 'Introducción' },
    { id: 'deslinde-clinico', title: '2. Naturaleza del Servicio (Deslinde Clínico)', shortTitle: 'Deslinde Clínico' },
    { id: 'emergencias', title: '3. Exclusión de Atención de Emergencias', shortTitle: 'Emergencias' },
    { id: 'inteligencia-artificial', title: '4. Uso del Copiloto Clínico e Inteligencia Artificial', shortTitle: 'Uso de IA' },
    { id: 'cuentas', title: '5. Cuentas, Credenciales y Validación Profesional', shortTitle: 'Cuentas' },
    { id: 'telemedicina', title: '6. Telemedicina y Consultas Digitales', shortTitle: 'Telemedicina' },
    { id: 'membresias-pagos', title: '7. Membresías, Cobros, Comisiones y Reembolsos', shortTitle: 'Membresías y Pagos' },
    { id: 'propiedad-intelectual', title: '8. Propiedad Intelectual y Uso Aceptable', shortTitle: 'Propiedad Intelectual' },
    { id: 'limitacion-responsabilidad', title: '9. Limitación de Responsabilidad y Garantías', shortTitle: 'Responsabilidad' },
    { id: 'indemnidad', title: '10. Indemnización y Blindaje Legal', shortTitle: 'Indemnización' },
    { id: 'multijurisdiccion', title: '11. Cumplimiento Multirregional (México, LATAM, USA, UE)', shortTitle: 'Multijurisdiccional' },
    { id: 'jurisdiccion-ley', title: '12. Ley Aplicable y Resolución de Disputas', shortTitle: 'Ley y Disputas' },
]

export default function TerminosPage() {
    const [activeSection, setActiveSection] = useState<string>('introduccion')

    useEffect(() => {
        const observers = new Map()

        const callback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id)
                }
            })
        }

        const observer = new IntersectionObserver(callback, {
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0,
        })

        sections.forEach((section) => {
            const el = document.getElementById(section.id)
            if (el) {
                observer.observe(el)
                observers.set(section.id, el)
            }
        })

        return () => {
            observer.disconnect()
        }
    }, [])

    const handleScrollTo = (id: string) => {
        const el = document.getElementById(id)
        if (el) {
            const offset = 90 // Account for fixed navbar
            const bodyRect = document.body.getBoundingClientRect().top
            const elementRect = el.getBoundingClientRect().top
            const elementPosition = elementRect - bodyRect
            const offsetPosition = elementPosition - offset

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
            setActiveSection(id)
        }
    }

    return (
        <div className="relative min-h-screen bg-stone-50/50 dark:bg-stone-950/20">
            {/* Elegant Background Accents */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-[40%] left-[20%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-500/2" />
                <div className="absolute top-[20%] right-[10%] h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[120px] dark:bg-amber-500/2" />
            </div>

            {/* Header Hero Section */}
            <div className="border-b border-stone-200/60 bg-white/70 py-16 backdrop-blur-md dark:border-stone-800/60 dark:bg-stone-900/70">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400">
                            <span>Documentación Legal Vigente</span>
                        </div>
                        <h1 className="font-sans text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
                            Términos del Servicio
                        </h1>
                        <p className="font-sans text-base text-stone-600 dark:text-stone-400">
                            Última actualización y entrada en vigor: <strong className="text-stone-950 dark:text-stone-200">27 de mayo de 2026</strong>.
                        </p>
                        <p className="max-w-2xl font-sans text-sm text-stone-500 dark:text-stone-400">
                            Estos términos regulan el acceso y uso de la plataforma digital, la academia y las herramientas tecnológicas integradas de <strong className="text-stone-900 dark:text-stone-200">SAPIHUM</strong>. Al acceder o usar nuestros servicios, aceptas obligarte en su totalidad a lo aquí dispuesto.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                    
                    {/* Sticky Sidebar Index - Desktop only */}
                    <div className="hidden lg:block">
                        <div className="sticky top-28 space-y-6">
                            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                                    Contenido
                                </h3>
                                <nav className="mt-4 space-y-1">
                                    {sections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => handleScrollTo(section.id)}
                                            className={`w-full text-left font-sans text-xs font-medium py-2.5 px-3 rounded-lg transition-all ${
                                                activeSection === section.id
                                                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                                                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100'
                                            }`}
                                        >
                                            {section.shortTitle}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            <div className="rounded-2xl border border-stone-200/60 bg-gradient-to-br from-blue-50/50 to-stone-50 p-6 dark:border-stone-800/60 dark:from-stone-900 dark:to-stone-950">
                                <h4 className="font-sans text-xs font-semibold text-stone-900 dark:text-stone-200">
                                    ¿Necesitas ayuda?
                                </h4>
                                <p className="mt-2 font-sans text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                                    Para dudas legales, aclaraciones sobre membresías o soporte, contáctanos en:
                                </p>
                                <a 
                                    href="mailto:legal@sapihum.com" 
                                    className="mt-3 inline-block font-sans text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    legal@sapihum.com
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Rich Legal Content Columns */}
                    <div className="lg:col-span-3 space-y-12">
                        
                        {/* Section 1 */}
                        <section id="introduccion" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[0].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    El presente documento constituye un contrato vinculante entre usted (en adelante, el &quot;Usuario&quot;, que puede actuar en calidad de profesional de la psicología, terapeuta, ponente, estudiante, paciente o visitante general) y <strong>SAPIHUM</strong> (incluyendo a sus filiales, directores, representantes y licenciatarios).
                                </p>
                                <p>
                                    Al interactuar, navegar, registrarse, comprar membresías o utilizar las herramientas del ecosistema en línea de SAPIHUM (incluyendo su sitio web, su suite de gestión clínica y su aula virtual), usted manifiesta de manera inequívoca y expresa su consentimiento de obligarse por estos Términos del Servicio, nuestra Política de Privacidad y cualesquiera otras reglas operativas que se publiquen periódicamente.
                                </p>
                                <p>
                                    <strong>Si usted no acepta estos términos de manera total y sin reservas, debe abstenerse de usar la plataforma de inmediato</strong>, dar de baja su cuenta y suspender la navegación en nuestros sitios. SAPIHUM se reserva el derecho de modificar unilateralmente estos términos en cualquier momento, publicando la versión actualizada con su fecha correspondiente. El uso continuado del software constituirá su aceptación vinculante de tales cambios.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 2 */}
                        <section id="deslinde-clinico" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[1].title}
                            </h2>
                            
                            {/* Critical Legal Warning Box */}
                            <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50/50 p-5 dark:border-amber-600 dark:bg-amber-950/20">
                                <h4 className="font-sans text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-400">
                                    ⚠️ AVISO LEGAL CRÍTICO Y DECLARACIÓN DE NO PRESTACIÓN DE SERVICIOS CLÍNICOS
                                </h4>
                                <p className="mt-2 font-sans text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                                    SAPIHUM es exclusivamente una plataforma de habilitación tecnológica provista bajo el modelo de Software como Servicio (SaaS) y un ecosistema de comunidad y formación académica. <strong>SAPIHUM NO es una clínica de salud mental, NO es una institución médica ni hospitalaria, NO emplea a los terapeutas y NO presta bajo ningún concepto servicios profesionales de psicología, psiquiatría, psicoterapia, diagnóstico clínico o intervención médica directa.</strong>
                                </p>
                            </div>

                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    El rol de SAPIHUM se limita estrictamente a proveer infraestructura en la nube y herramientas digitales para optimizar la práctica privada de terapeutas independientes y facilitar su capacitación continua. Consecuentemente:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Independencia del Profesional:</strong> Todos los profesionales que ofrecen terapia, consultorías o programas educativos a través de la plataforma son contratistas independientes e independientes de SAPIHUM. Cada terapeuta ejerce su profesión bajo su exclusiva responsabilidad, criterio clínico, deontología y amparado en su propia cédula profesional o licencia habilitante.
                                    </li>
                                    <li>
                                        <strong>Exención de Relación Paciente-SAPIHUM:</strong> La relación clínica se constituye única y exclusivamente entre el Paciente y el Terapeuta independiente. SAPIHUM es un tercero técnico ajeno a dicha relación y no asume responsabilidad alguna por los diagnósticos, planes terapéuticos, notas clínicas, recetas, mala praxis, negligencia o cualquier otra conducta derivada del tratamiento.
                                    </li>
                                    <li>
                                        <strong>Ausencia de Garantías de Resultados:</strong> SAPIHUM no avala, garantiza, califica ni recomienda las habilidades específicas, efectividad o resultados clínicos de ningún profesional listado en su directorio o comunidad.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 3 */}
                        <section id="emergencias" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[2].title}
                            </h2>

                            <div className="rounded-xl border-l-4 border-red-500 bg-red-50/50 p-5 dark:border-red-600 dark:bg-red-950/20">
                                <h4 className="font-sans text-sm font-bold uppercase tracking-wide text-red-800 dark:text-red-400">
                                    🚨 EXCLUSIÓN ABSOLUTA DE ATENCIÓN DE EMERGENCIAS Y CRISIS AGUDAS
                                </h4>
                                <p className="mt-2 font-sans text-xs leading-relaxed text-red-800/90 dark:text-red-300/90">
                                    <strong>LA PLATAFORMA DE SAPIHUM Y SUS HERRAMIENTAS NO ESTÁN DISEÑADAS NI HABILITADAS PARA GESTIONAR O ATENDER EMERGENCIAS MÉDICAS, PSIQUIÁTRICAS O SITUACIONES DE CRISIS AGUDA DE SALUD MENTAL</strong> (incluyendo de forma enunciativa pero no limitativa: ideación suicida activa, conductas autolesivas severas, brotes psicóticos, intoxicaciones agudas o abuso físico/sexual en curso).
                                </p>
                            </div>

                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    Si usted o la persona por la que consulta se encuentra en una situación de peligro inminente o crisis psiquiátrica grave, <strong>debe abandonar esta plataforma de inmediato y comunicarse con los servicios de emergencia de su localidad geográfica</strong> (como el 911 en México y Estados Unidos, el 112 en Europa, u otros números de atención a crisis nacionales), o acudir a la sala de emergencias de un hospital cercano.
                                </p>
                                <p>
                                    El uso de la agenda, mensajería, transcripción con IA o videollamadas de SAPIHUM ante escenarios de crisis aguda se realiza bajo el riesgo y responsabilidad exclusivos del usuario. SAPIHUM queda exonerada de toda reclamación por daños a la integridad física, psíquica o fallecimiento que resulten de omitir esta advertencia.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 4 */}
                        <section id="inteligencia-artificial" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[3].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    SAPIHUM integra herramientas basadas en Inteligencia Artificial y tecnologías de procesamiento de lenguaje natural (en adelante, el &quot;Copiloto Clínico SAPIHUM&quot;) destinadas a facilitar a los terapeutas el registro de notas clínicas estructuradas (como notas SOAP), resúmenes de sesión y transcripciones automáticas a partir de audios.
                                </p>
                                <p>
                                    El uso de estas herramientas avanzadas está sujeto rigurosamente a las siguientes reglas contractuales de blindaje:
                                </p>
                                <ul className="list-disc pl-5 space-y-3">
                                    <li>
                                        <strong>Responsabilidad de Validación Humana:</strong> El Copiloto Clínico actúa estrictamente como un asistente secundario que genera borradores técnicos. El terapeuta profesional asume la obligación indelegable de revisar, corregir, modificar, completar y firmar manualmente todas las transcripciones, resúmenes y notas generadas por la IA antes de integrarlos al expediente clínico del paciente o tomar cualquier decisión médica. <strong>El terapeuta asume total responsabilidad por cualquier diagnóstico o tratamiento basado directa o indirectamente en los textos que no hayan sido validados clínicamente bajo su propio criterio humano.</strong>
                                    </li>
                                    <li>
                                        <strong>Garantía de Consentimiento del Paciente (Obligación de Hacer):</strong> Al activar y utilizar la grabadora clínica o el servicio de transcripción por IA de SAPIHUM, el terapeuta garantiza expresamente que ha obtenido el <strong>consentimiento informado, previo, expreso y por escrito del Paciente</strong> (o de su tutor legal en caso de menores de edad) para que la sesión de terapia sea grabada, procesada y transcrita a través de SAPIHUM.
                                    </li>
                                    <li>
                                        <strong>Mecanismo de Indemnidad por Consentimiento:</strong> Si el terapeuta no cuenta con dicha autorización explícita del paciente y procede al uso de la herramienta de IA, se considerará una violación grave a estos términos. El terapeuta se obliga a mantener a SAPIHUM totalmente indemne frente a cualquier queja, demanda, procedimiento regulatorio o multa nacional o internacional derivada de la falta de dicho consentimiento.
                                    </li>
                                    <li>
                                        <strong>Privacidad y Destino de los Datos de la Sesión:</strong> SAPIHUM se compromete a que el procesamiento de audio/texto clínico se realice mediante APIs seguras de nivel empresarial. Los datos transmitidos se cifran tanto en tránsito como en reposo. SAPIHUM garantiza que las transcripciones clínicas confidenciales <strong>no son vendidas ni utilizadas para el entrenamiento público</strong> de modelos fundacionales de terceros proveedores (como OpenAI, Anthropic, Google o similares), protegiendo la confidencialidad absoluta del encuentro terapéutico.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 5 */}
                        <section id="cuentas" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[4].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    Para acceder a las funciones avanzadas de SAPIHUM, el usuario debe crear una cuenta proporcionando información verídica, exacta y actualizada en el formulario de registro.
                                </p>
                                <p>
                                    <strong>Validación del Perfil Profesional:</strong> SAPIHUM se reserva el derecho de exigir a los usuarios con perfil de psicólogo o terapeuta la exhibición de su Cédula Profesional oficial (en México), Licencia de Práctica correspondiente (en su estado o país respectivo), certificaciones habilitantes o comprobantes académicos. SAPIHUM podrá denegar, restringir o dar de baja cuentas profesionales si detecta falsificación de credenciales, ejercicio ilegal de la profesión, sospecha de fraude o suspensión de licencia por parte de la autoridad reguladora de salud competente.
                                </p>
                                <p>
                                    <strong>Custodia de Credenciales:</strong> El titular de la cuenta es el único y exclusivo responsable de salvaguardar la confidencialidad de su contraseña y los métodos de autenticación de doble factor (2FA). SAPIHUM no se responsabiliza por brechas de seguridad, pérdidas de datos, o accesos no autorizados generados por la negligencia en la custodia de credenciales por parte del usuario o sus colaboradores habilitados.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 6 */}
                        <section id="telemedicina" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[5].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    SAPIHUM provee una suite técnica para la realización de teleconsultas mediante flujos de audio y video. El usuario clínico y el paciente reconocen que la telemedicina cuenta con limitaciones intrínsecas:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Fallas de Conectividad e Infraestructura:</strong> Las videollamadas dependen de redes de internet externas, plataformas de infraestructura WebRTC de terceros y el hardware propio de los usuarios. SAPIHUM no se hace responsable por caídas de conexión, latencia, mala calidad del video, interrupciones técnicas o fallos operativos durante el desarrollo de la sesión en vivo.
                                    </li>
                                    <li>
                                        <strong>Espacio Seguro y Privado:</strong> El profesional y el paciente se obligan mutuamente a conectarse exclusivamente desde ubicaciones físicas privadas, silenciosas y seguras, garantizando que terceros ajenos a la terapia no escuchen el contenido de la sesión, de conformidad con las directrices de privacidad HIPAA y las leyes de datos nacionales.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 7 */}
                        <section id="membresias-pagos" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[6].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    <strong>Planes y Facturación Recurrente:</strong> El acceso a ciertas herramientas, membresías de comunidad, academia en línea y el software clínico se sujeta al pago puntual de las tarifas vigentes del plan seleccionado (mensual, anual o pago por evento/curso). La facturación y cargos recurrentes se gestionan de forma cifrada a través de procesadores de pago acreditados internacionalmente (como Stripe). Al registrar su método de pago, el Usuario autoriza el cargo automático periódico de las tarifas aplicables.
                                </p>
                                <p>
                                    <strong>Política Estricta de Reembolsos y Cancelaciones:</strong> Las cancelaciones de los planes de suscripción pueden realizarse en cualquier momento a través del panel de control del usuario y serán aplicables para el siguiente ciclo de facturación.
                                </p>
                                <p className="bg-stone-100 dark:bg-stone-900 p-4 rounded-xl font-mono text-xs border border-stone-200 dark:border-stone-800 leading-relaxed text-stone-700 dark:text-stone-300">
                                    SAPIHUM APLICA UNA POLÍTICA ESTRICTA DE &quot;NO REEMBOLSOS&quot; (NO REFUNDS). Debido a la provisión inmediata de acceso a contenidos educativos descargables, servicios SaaS en la nube y activos digitales del ecosistema, no se realizarán reembolsos de pagos ya efectuados por períodos de facturación activos, parciales ni por inscripciones completadas a cursos de la academia o congresos en línea.
                                </p>
                                <p>
                                    <strong>Esquema de Comisiones y Reparto (Congresos y Cursos):</strong> En aquellos casos donde los ponentes o profesionales comercialicen boletos, mentorías o cursos mediante SAPIHUM, se aplicarán las tasas de reparto de comisiones preestablecidas (como el reparto 80% ponente / 50% canal SAPIHUM especificado en la configuración comercial aplicable). El procesamiento de pagos, retención tributaria local o comisiones de pasarela de pago se deducirán del monto neto de liquidación correspondiente al profesional conforme a los plazos pactados.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 8 */}
                        <section id="propiedad-intelectual" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[7].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    Todos los derechos de propiedad intelectual, derechos de autor, marcas comerciales registradas, nombres de dominio, secretos comerciales, código fuente de software, interfaces gráficas, logotipos y contenidos de capacitación académica disponibles en la plataforma de SAPIHUM son propiedad exclusiva de SAPIHUM y de sus respectivos licenciantes.
                                </p>
                                <p>
                                    <strong>Licencia de Uso Limitada:</strong> Se concede al usuario registrado una licencia personal, no exclusiva, intransferible y revocable para utilizar la plataforma y acceder a los contenidos exclusivamente para fines de su propia formación académica o para la gestión interna de su consultorio profesional de conformidad con estos términos.
                                </p>
                                <p>
                                    <strong>Prohibiciones de Uso Aceptable:</strong> Queda terminantemente prohibido llevar a cabo ingeniería inversa, descompilar, rastrear mediante herramientas automatizadas (web scraping), extraer bases de datos, vulnerar los sistemas de seguridad de la plataforma o distribuir sin autorización comercial los materiales con derechos de autor del aula académica de SAPIHUM.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 9 */}
                        <section id="limitacion-responsabilidad" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[8].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p className="uppercase font-semibold tracking-wider text-xs text-stone-400">
                                    ESTA SECCIÓN CONSTITUYE UN ELEMENTO ESENCIAL DEL ACUERDO DE COMPENSACIÓN DE RIESGOS:
                                </p>
                                <p>
                                    LA PLATAFORMA DE SAPIHUM SE SUMINISTRA &quot;TAL CUAL&quot; (AS IS) Y &quot;SE SEGÚN DISPONIBILIDAD&quot; (AS AVAILABLE), SIN NINGÚN TIPO DE GARANTÍA EXPRESA, IMPLÍCITA O ESTATUTARIA. SAPIHUM RECHAZA TODA GARANTÍA DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO ESPECÍFICO, SEGURIDAD ABSOLUTA, ACTUALIZACIÓN CONSTANTE O AUSENCIA DE ERRORES DE PROGRAMACIÓN.
                                </p>
                                <p>
                                    EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE EN CUALQUIER JURISDICCIÓN, EN NINGÚN CASO SAPIHUM, SUS FUNDADORES, DIRECTIVOS O EMPLEADOS SERÁN RESPONSABLES POR DAÑOS INDIRECTOS, INCIDENTALES, PUNITIVOS, ESPECIALES O CONSECUENTES (INCLUYENDO DAÑOS POR PÉRDIDA DE BENEFICIOS COMERCIALES, PÉRDIDA DE EXPEDIENTES CLÍNICOS, MAL PRAXIS MÉDICA, LESIONES CORPORALES O DAÑOS MORALES) QUE SE DERIVEN O ESTÉN RELACIONADOS CON EL USO O LA IMPOSIBILIDAD DE USAR EL SOFTWARE, AUNQUE SE HAYA ADVERTIDO DE LA POSIBILIDAD DE TALES DAÑOS.
                                </p>
                                <p>
                                    LA RESPONSABILIDAD MÁXIMA Y TOTAL DE SAPIHUM POR CUALQUIER RECLAMACIÓN BAJO ESTE CONTRATO, SEA POR VÍA EXTRACONTRACTUAL, CIVIL, CONTRACTUAL O DE CONSUMO, SE LIMITA AL MONTO MENOR DE: (A) $100.00 USD (CIEN DÓLARES ESTADOUNIDENSES) O (B) LA CANTIDAD TOTAL DE TARIFAS DE MEMBRESÍA QUE EL USUARIO HAYA EFECTIVAMENTE PAGADO A SAPIHUM EN LOS 12 MESES INMEDIATAMENTE ANTERIORES AL HECHO QUE ORIGINÓ LA SUPUESTA RESPONSABILIDAD.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 10 */}
                        <section id="indemnidad" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[9].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    El Usuario se compromete de manera irrevocable a defender, indemnizar y mantener completamente indemne a SAPIHUM, sus directores, licenciatarios, accionistas y sucesores corporativos frente a cualquier queja, auditoría, requerimiento, demanda, reclamación civil, administrativa, penal o penal, incluyendo honorarios razonables de abogados, que surja de:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        Su conducta, negligencia profesional, diagnóstico clínico erróneo o mala praxis en el ejercicio de su profesión con los pacientes.
                                    </li>
                                    <li>
                                        La omisión del terapeuta de recabar los consentimientos expresos de los pacientes para grabaciones de audio/video y procesamiento por Inteligencia Artificial.
                                    </li>
                                    <li>
                                        La violación de cualquier ley nacional o internacional, regulaciones sanitarias locales o normas éticas profesionales.
                                    </li>
                                    <li>
                                        El uso indebido, hackeo, filtración intencionada o transferencia ilegal de los expedientes clínicos gestionados bajo su cuenta o credenciales.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 11 */}
                        <section id="multijurisdiccion" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[10].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    SAPIHUM opera a nivel internacional con usuarios y pacientes ubicados en diversos países. Para garantizar un correcto blindaje legal multirregional, se establecen las siguientes cláusulas específicas de cumplimiento:
                                </p>
                                
                                <div className="space-y-4 mt-6">
                                    {/* Mexico */}
                                    <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                                        <h4 className="font-sans text-sm font-bold text-stone-900 dark:text-stone-100">
                                            🇲🇽 Regulación en México
                                        </h4>
                                        <p className="mt-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                                            Conforme a la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y el Reglamento de la Ley General de Salud en Materia de Prestación de Servicios de Atención Médica, el profesional clínico actúa como Responsable Único de los expedientes de sus pacientes y SAPIHUM actúa como Encargado del Tratamiento. Adicionalmente, el profesional se compromete a dar pleno cumplimiento a la <strong>NOM-004-SSA3-2012</strong> (Expediente Clínico) y la <strong>NOM-024-SSA3-2012</strong> (Sistemas de Información de Registro Electrónico para la Salud), garantizando la conservación mínima por 5 años de la información de los pacientes.
                                        </p>
                                    </div>

                                    {/* USA */}
                                    <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                                        <h4 className="font-sans text-sm font-bold text-stone-900 dark:text-stone-100">
                                            🇺🇸 Estados Unidos de América (USA)
                                        </h4>
                                        <p className="mt-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                                            El profesional clínico que opere bajo las leyes estadounidenses o trate a pacientes residentes en EE.UU. asume el cumplimiento estricto del estándar <strong>HIPAA (Health Insurance Portability and Accountability Act)</strong>. SAPIHUM actúa como proveedor tecnológico independiente. Asimismo, se reconoce la aplicabilidad de los términos estatales de privacidad como la <strong>CCPA/CPRA</strong> de California y las exenciones para intermediarios digitales previstas en la <strong>Sección 230 de la Ley de Decencia en las Comunicaciones (CDA)</strong> y las protecciones de la <strong>DMCA (Digital Millennium Copyright Act)</strong> para la retirada de contenidos infractores.
                                        </p>
                                    </div>

                                    {/* Europe */}
                                    <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                                        <h4 className="font-sans text-sm font-bold text-stone-900 dark:text-stone-100">
                                            🇪🇺 Unión Europea (UE / GDPR)
                                        </h4>
                                        <p className="mt-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                                            Para los usuarios residentes o que traten a ciudadanos de la Unión Europea, el tratamiento de sus datos se rige por el <strong>Reglamento General de Protección de Datos (GDPR)</strong>. SAPIHUM y el terapeuta profesional pactan la aplicabilidad del Anexo de Procesamiento de Datos (DPA) estándar, donde el terapeuta actúa en calidad de <strong>Data Controller</strong> (Responsable) y SAPIHUM en calidad de <strong>Data Processor</strong> (Encargado), aplicando Cláusulas Contractuales Tipo (Standard Contractual Clauses - SCCs) vigentes para la transferencia internacional segura de datos sensibles a servidores de alojamiento aprobados.
                                        </p>
                                    </div>

                                    {/* Latam */}
                                    <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                                        <h4 className="font-sans text-sm font-bold text-stone-900 dark:text-stone-100">
                                            🌎 Latinoamérica (LATAM)
                                        </h4>
                                        <p className="mt-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                                            El profesional que opere en países como Colombia (Ley 1581 de 2012), Argentina (Ley 25.326), Chile o Perú garantiza el cumplimiento de la respectiva regulación nacional en materia de protección de datos de salud y los reglamentos locales de protección al consumidor y de ejercicio de la telepsicología o ciberterapia dictados por las correspondientes federaciones o ministerios de salud locales.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 12 */}
                        <section id="jurisdiccion-ley" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[11].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    <strong>México, Latinoamérica y resto del mundo (excluyendo residentes de USA):</strong> Cualquier disputa, reclamación, controversia o procedimiento judicial relacionado con estos Términos del Servicio o el uso de la plataforma SAPIHUM se someterá de forma exclusiva a las leyes aplicables de los Estados Unidos Mexicanos, renunciando a cualquier otra jurisdicción por razón de domicilios presentes o futuros, determinándose la competencia territorial única en los tribunales federales de la <strong>Ciudad de México (CDMX)</strong>.
                                </p>
                                <p>
                                    <strong>Residentes de los Estados Unidos de América (USA):</strong>
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Arbitraje Vinculante Obligatorio:</strong> Cualquier controversia o reclamación que surja del uso de la plataforma será resuelta de manera exclusiva mediante arbitraje comercial vinculante, de conformidad con las Reglas de Arbitraje Comercial de la <strong>American Arbitration Association (AAA)</strong>, celebrándose la audiencia en idioma español.
                                    </li>
                                    <li>
                                        <strong>Renuncia a Acciones Colectivas (Class Action Waiver):</strong> Toda disputa será resuelta de manera estrictamente individual. Usted y SAPIHUM pactan expresamente la renuncia irrevocable a interponer demandas colectivas, arbitrajes consolidados, acciones de defensoría pública o en representación de un grupo de consumidores.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Final Consent & Confirmation Card */}
                        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
                            <h3 className="font-sans text-lg font-bold text-stone-900 dark:text-stone-100">
                                Confirmación de Aceptación
                            </h3>
                            <p className="font-sans text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                                Al registrarte, suscribirte o continuar navegando en SAPIHUM, manifiestas bajo protesta de decir verdad que posees la capacidad legal plena para obligarte contractualmente, que has leído detenidamente estos Términos del Servicio y que comprendes en su totalidad los alcances de las limitaciones de responsabilidad y deslindes de práctica clínica médica aquí establecidos.
                            </p>
                            <div className="pt-2 flex flex-col sm:flex-row gap-4">
                                <Link 
                                    href="/aviso-privacidad" 
                                    className="inline-flex justify-center items-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    Revisar Aviso de Privacidad
                                </Link>
                                <Link 
                                    href="/" 
                                    className="inline-flex justify-center items-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                                >
                                    Volver al Inicio
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
