'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LegalSection {
    id: string
    title: string
    shortTitle: string
}

const sections: LegalSection[] = [
    { id: 'responsable', title: '1. Identidad y Domicilio del Responsable del Tratamiento', shortTitle: 'Responsable' },
    { id: 'datos-recabados', title: '2. Datos Personales Recabados (Generales y Sensibles)', shortTitle: 'Datos Recabados' },
    { id: 'finalidades', title: '3. Finalidades Primarias y Secundarias del Tratamiento', shortTitle: 'Finalidades' },
    { id: 'ia-audio', title: '4. Tratamiento Especial de Audios, Transcripciones e IA', shortTitle: 'Audios e IA' },
    { id: 'transferencias', title: '5. Transferencias de Datos y Flujos Internacionales', shortTitle: 'Transferencias' },
    { id: 'derechos-arco', title: '6. Ejercicio de Derechos ARCO (México y LATAM)', shortTitle: 'Derechos ARCO' },
    { id: 'gdpr-ue', title: '7. Derechos de los Usuarios en la Unión Europea (GDPR)', shortTitle: 'Cumplimiento UE' },
    { id: 'usa-hipaa', title: '8. Protección de Salud (HIPAA) y Privacidad Estatal (CCPA)', shortTitle: 'Cumplimiento USA' },
    { id: 'seguridad-retencion', title: '9. Medidas de Seguridad, Confidencialidad y Retención', shortTitle: 'Seguridad' },
    { id: 'cookies', title: '10. Uso de Cookies y Tecnologías de Rastreo', shortTitle: 'Cookies' },
    { id: 'contacto-cambios', title: '11. Medios de Contacto y Modificaciones al Aviso', shortTitle: 'Contacto' },
]

export default function AvisoPrivacidadPage() {
    const [activeSection, setActiveSection] = useState<string>('responsable')

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
                            <span>Cumplimiento Multirregional de Privacidad</span>
                        </div>
                        <h1 className="font-sans text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
                            Aviso de Privacidad Integral
                        </h1>
                        <p className="font-sans text-base text-stone-600 dark:text-stone-400">
                            Última actualización y entrada en vigor: <strong className="text-stone-950 dark:text-stone-200">27 de mayo de 2026</strong>.
                        </p>
                        <p className="max-w-2xl font-sans text-sm text-stone-500 dark:text-stone-400">
                            En <strong className="text-stone-900 dark:text-stone-200">SAPIHUM</strong>, la privacidad, confidencialidad y seguridad de los datos personales (incluyendo la información clínica sensible) de nuestros terapeutas, alumnos, pacientes y visitantes es nuestro compromiso fundamental. Este aviso detalla cómo tratamos su información bajo estándares internacionales de alto nivel.
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
                                    Secciones
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
                                    Oficina de Privacidad
                                </h4>
                                <p className="mt-2 font-sans text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                                    Para ejercer derechos ARCO, retirar consentimientos o solicitar portabilidad de tus expedientes, escribe a:
                                </p>
                                <a 
                                    href="mailto:privacidad@mail.sapihum.com" 
                                    className="mt-3 inline-block font-sans text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    privacidad@mail.sapihum.com
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Rich Legal Content Columns */}
                    <div className="lg:col-span-3 space-y-12">
                        
                        {/* Section 1 */}
                        <section id="responsable" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[0].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    La marca <strong>SAPIHUM</strong>, operada tecnológicamente por la persona física o moral titular del software y el ecosistema en línea (en adelante indistintamente el &quot;Responsable&quot;), con domicilio para oír y recibir notificaciones en la Ciudad de México, México, actúa como el responsable de la recolección, resguardo, uso, transferencia y protección de sus datos personales.
                                </p>
                                <p>
                                    Este Aviso de Privacidad regula el tratamiento de datos para usuarios generales, ponentes independientes, estudiantes de nuestra academia, profesionales de la psicología adscritos a las membresías, y de manera indirecta, los datos clínicos de pacientes que los terapeutas de manera libre capturen o procesen dentro de la plataforma en la que SAPIHUM ejerce como encargado.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 2 */}
                        <section id="datos-recabados" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[1].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    Para la correcta prestación de nuestros servicios tecnológicos, dividimos la recolección de información en las siguientes categorías de datos personales:
                                </p>
                                
                                <div className="space-y-4 my-6">
                                    <div className="border border-stone-200/80 rounded-xl p-5 dark:border-stone-800 bg-white dark:bg-stone-900">
                                        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                                            A. Datos Generales de Identificación y Contacto (Usuarios y Terapeutas)
                                        </h4>
                                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                            Nombre completo, dirección de correo electrónico, número de teléfono móvil, país de residencia, zona horaria y fotografía de perfil para el directorio profesional.
                                        </p>
                                    </div>

                                    <div className="border border-stone-200/80 rounded-xl p-5 dark:border-stone-800 bg-white dark:bg-stone-900">
                                        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                                            B. Datos Académicos y Profesionales (Únicamente Terapeutas)
                                        </h4>
                                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                            Número de Cédula Profesional oficial (México) o Licencia de Práctica (en el estado/país respectivo), universidad de procedencia, especializaciones cursadas, experiencia clínica anterior, afiliaciones institucionales y currículum profesional.
                                        </p>
                                    </div>

                                    <div className="border border-stone-200/80 rounded-xl p-5 dark:border-stone-800 bg-white dark:bg-stone-900">
                                        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                                            C. Datos de Facturación y Transacciones Financieras
                                        </h4>
                                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                            RFC o Tax ID, domicilio fiscal, régimen tributario y datos de cuenta para comisiones de ponentes. <i>Nota: los datos de tarjetas de crédito/débito nunca se almacenan en nuestros servidores y se procesan directamente de forma cifrada mediante Stripe.</i>
                                        </p>
                                    </div>

                                    <div className="border border-stone-200 bg-red-50/20 rounded-xl p-5 dark:border-stone-800/80 dark:bg-stone-900">
                                        <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">
                                            🚨 D. Datos Personales Sensibles de Salud y Clínicos (Pacientes)
                                        </h4>
                                        <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                                            Bajo la LFPDPPP, GDPR y la normativa HIPAA, los datos de salud se catalogan como <strong>Datos Personales Sensibles</strong>. Recabamos y procesamos a través de la cuenta del profesional: expedientes clínicos integrales, notas SOAP de evolución de consulta, registros de agenda de citas, historiales médicos y de psicoterapia, resultados de test diagnósticos aplicados, grabaciones de audio clínico de las sesiones de terapia y sus transcripciones generadas por Inteligencia Artificial.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 3 */}
                        <section id="finalidades" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[2].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    Los datos personales proporcionados se tratarán estrictamente de conformidad con las siguientes finalidades:
                                </p>
                                <ul className="list-decimal pl-5 space-y-3">
                                    <li>
                                        <strong>Finalidades Primarias (Esenciales para la relación jurídica):</strong>
                                        <ul className="list-disc pl-5 mt-1.5 space-y-1.5 text-xs text-stone-500 dark:text-stone-400">
                                            <li>Creación, gestión y validación de las cuentas profesionales y de pacientes en el software.</li>
                                            <li>Habilitar el funcionamiento técnico del calendario, la agenda clínica, la suite de videollamadas de telemedicina y los repositorios seguros de expedientes clínicos.</li>
                                            <li>Procesar los pagos de membresías, boletos para congresos académicos y programas educativos de la academia SAPIHUM.</li>
                                            <li>Ejecutar los algoritmos de Inteligencia Artificial para la transcripción y generación automática de borradores de notas SOAP a petición del terapeuta.</li>
                                            <li>Dar cumplimiento a obligaciones fiscales y requerimientos regulatorios de conservación clínica (NOM-004-SSA3-2012).</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Finalidades Secundarias (Fines accesorios):</strong>
                                        <ul className="list-disc pl-5 mt-1.5 space-y-1.5 text-xs text-stone-500 dark:text-stone-400">
                                            <li>Envío de correos informativos sobre actualizaciones técnicas del software.</li>
                                            <li>Comunicaciones de marketing, newsletters semanales de la comunidad profesional y lanzamiento de nuevos cursos y congresos.</li>
                                            <li>Desarrollo interno de estadísticas agregadas y <strong>anónimas</strong> sobre tendencias de la práctica psicológica a fin de optimizar los modelos de IA de la plataforma (sin que nunca se utilicen datos personales identificables).</li>
                                        </ul>
                                    </li>
                                </ul>
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                                    En caso de que no desee que sus datos sean tratados para las finalidades secundarias descritas, usted puede enviar un correo a <a href="mailto:privacidad@mail.sapihum.com" className="text-blue-600 hover:underline dark:text-blue-400">privacidad@mail.sapihum.com</a> en cualquier momento solicitando su exclusión de dichas listas de difusión.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 4 */}
                        <section id="ia-audio" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[3].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    <strong>Tratamiento del Audio Clínico y Voz:</strong> SAPIHUM integra un Copiloto Clínico basado en Inteligencia Artificial que procesa grabaciones de voz de las sesiones terapéuticas. El flujo de privacidad de esta sensible función opera bajo estrictas salvaguardas:
                                </p>
                                <ul className="list-disc pl-5 space-y-3">
                                    <li>
                                        <strong>Cifrado E2E en Tránsito:</strong> Los archivos de audio grabados por el terapeuta se transmiten cifrados hacia los servidores a través del protocolo HTTPS y TLS 1.3.
                                    </li>
                                    <li>
                                        <strong>No Persistencia de Audios en Modelos Públicos:</strong> Los datos transmitidos para transcripción se envían a APIs seguras provistas por SAPIHUM o sus proveedores empresariales técnicos. <strong>SAPIHUM prohíbe explícitamente y bloquea contractualmente a sus proveedores tecnológicos el uso de la voz o las transcripciones clínicas para el entrenamiento de Inteligencias Artificiales de acceso abierto.</strong>
                                    </li>
                                    <li>
                                        <strong>Eliminación Permanente de Grabaciones de Audio:</strong> Una vez generada la transcripción y el borrador de la nota SOAP, el archivo de audio original se elimina de forma permanente del almacenamiento activo conforme a la configuración establecida por el terapeuta, quedando resguardado únicamente el registro de texto en el expediente clínico del terapeuta.
                                    </li>
                                    <li>
                                        <strong>Obligación de Consentimiento del Paciente:</strong> El profesional asume la responsabilidad contractual de recabar la aprobación previa por escrito del paciente antes de realizar grabaciones. SAPIHUM no procesa proactivamente audios de pacientes sin que el terapeuta desencadene manualmente la acción, asumiendo que cuenta con dicho consentimiento.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 5 */}
                        <section id="transferencias" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[4].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    SAPIHUM <strong>NO vende, arrienda, comercializa ni distribuye</strong> bajo ningún concepto datos personales de sus usuarios o de los pacientes a terceras empresas o anunciantes.
                                </p>
                                <p>
                                    Las transferencias de datos se limitan única y exclusivamente a aquellas indispensables para posibilitar el funcionamiento de la plataforma y el cumplimiento contractual:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Proveedores de Alojamiento y Base de Datos (Cloud):</strong> Supabase, Amazon Web Services (AWS) y Vercel (servidores ubicados en Estados Unidos y la Unión Europea).
                                    </li>
                                    <li>
                                        <strong>Procesadores de Pago:</strong> Stripe Inc., para procesar de forma externa los cobros de membresías y transacciones comerciales del congreso de manera cifrada.
                                    </li>
                                    <li>
                                        <strong>Pasarelas de Mensajería y Correo:</strong> Resend, Sendgrid o Twilio, para la entrega segura de notificaciones operativas de agenda, correos de validación de cuentas y recordatorios de telemedicina.
                                    </li>
                                    <li>
                                        <strong>Cumplimiento de Mandato de Ley:</strong> A requerimiento fundado y motivado por escrito dictado por autoridades administrativas, sanitarias o judiciales competentes locales o federales en los países donde operamos.
                                    </li>
                                </ul>
                                <p>
                                    Cuando la transferencia implique el envío de datos a países que no cuenten con las mismas leyes de protección de datos que su jurisdicción de origen, SAPIHUM implementará medidas de seguridad contractuales basadas en las <strong>Cláusulas Contractuales Tipo (SCCs)</strong> o en la acreditación de cumplimiento HIPAA / GDPR para garantizar la seguridad de la información.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 6 */}
                        <section id="derechos-arco" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[5].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    En cumplimiento con la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> vigente en México y regulaciones de Latinoamérica, usted tiene derecho a ejercer sus derechos ARCO en cualquier momento:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Acceso:</strong> Conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso.</li>
                                    <li><strong>Rectificación:</strong> Solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o esté incompleta.</li>
                                    <li><strong>Cancelación:</strong> Solicitar que eliminemos su información de nuestros registros y bases de datos cuando considere que no está siendo utilizada adecuadamente (sujeto a plazos legales de retención clínica de 5 años bajo la NOM-004-SSA3-2012).</li>
                                    <li><strong>Oposición:</strong> Oponerse por motivos legítimos al tratamiento de sus datos personales para fines específicos.</li>
                                </ul>
                                <p>
                                    <strong>Procedimiento de Solicitud ARCO:</strong> Para ejercer estos derechos o revocar su consentimiento, debe enviar una solicitud formal por escrito al correo <a href="mailto:privacidad@mail.sapihum.com" className="text-blue-600 hover:underline dark:text-blue-400">privacidad@mail.sapihum.com</a> adjuntando: (1) Identificación oficial vigente (INE o Pasaporte), (2) Correo electrónico asociado a su cuenta SAPIHUM, (3) Descripción clara del derecho ARCO que desea ejercer e indicando detalladamente qué datos se pretende cancelar, rectificar u oponerse. La solicitud será atendida y respondida en un plazo máximo de 20 días hábiles.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 7 */}
                        <section id="gdpr-ue" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[6].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    Si reside habitualmente en la Unión Europea o el Espacio Económico Europeo, su información es tratada conforme a las directrices del <strong>Reglamento General de Protección de Datos (GDPR)</strong>. En este ámbito:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Derechos Adicionales:</strong> Además de los equivalentes a los derechos ARCO, usted posee el derecho a la <strong>Portabilidad de los Datos</strong> (recibir su información en un formato estructurado y de uso común), el derecho al <strong>Olvido</strong> (eliminación total si se retira el consentimiento) y el derecho a solicitar la <strong>Limitación del Tratamiento</strong> de sus datos sensibles de salud.
                                    </li>
                                    <li>
                                        <strong>Bases Jurídicas de Licitud:</strong> Las bases legales en las que sustentamos el tratamiento de sus datos bajo GDPR son: (a) la ejecución del contrato de prestación de servicios tecnológicos para operar su cuenta, (b) el cumplimiento de nuestras obligaciones legales fiscales y de salud, y (c) la obtención de su consentimiento explícito para tratamientos de Inteligencia Artificial y datos de salud sensibles.
                                    </li>
                                </ul>
                                <p>
                                    Cualquier queja relacionada con el tratamiento de datos personales no resuelta satisfactoriamente por nuestra Oficina de Privacidad podrá ser presentada ante la correspondiente Autoridad de Control en materia de protección de datos de su estado miembro de la UE.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 8 */}
                        <section id="usa-hipaa" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[7].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    <strong>Estándares HIPAA (Health Insurance Portability and Accountability Act):</strong> Para profesionales de la psicología que operan bajo leyes federales de los Estados Unidos y procesan Información de Salud Protegida (Protected Health Information - PHI) de pacientes, SAPIHUM implementa medidas de seguridad técnicas que apoyan el cumplimiento de HIPAA, actuando bajo la figura de proveedor tecnológico.
                                </p>
                                <p>
                                    <strong>Privacidad en el Estado de California (CCPA / CPRA):</strong> En cumplimiento con la Ley de Privacidad del Consumidor de California, los usuarios residentes de California tienen el derecho de solicitar información detallada sobre las categorías de datos recolectados, conocer si sus datos han sido vendidos (SAPIHUM no vende información), y solicitar la eliminación de su información personal. Puede ejercer estas peticiones a través del correo <a href="mailto:privacidad@mail.sapihum.com" className="text-blue-600 hover:underline dark:text-blue-400">privacidad@mail.sapihum.com</a> sin ser objeto de ninguna discriminación en el precio o nivel del servicio.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 9 */}
                        <section id="seguridad-retencion" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[8].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    SAPIHUM implementa medidas de seguridad de nivel administrativo, técnico y físico rigurosas para salvaguardar sus datos frente a pérdidas, robos, alteraciones o accesos no autorizados:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Cifrado TLS/HTTPS de extremo a extremo para todas las transmisiones de datos.</li>
                                    <li>Cifrado a nivel de base de datos en reposo utilizando el algoritmo estándar AES-256.</li>
                                    <li>Segregación estricta de base de datos a nivel lógico para evitar cruce de información entre consultorios clínicos.</li>
                                    <li>Registros detallados de auditoría de accesos (Access Logs) para identificar cualquier interacción inusual con la información sensible.</li>
                                </ul>
                                <p>
                                    <strong>Plazos de Retención:</strong> Los datos personales y académicos se conservarán mientras dure la relación comercial y no se solicite la cancelación de la cuenta. En cumplimiento de las directrices de salud en México (NOM-004-SSA3-2012) e internacionales, los expedientes clínicos de pacientes generados y guardados por los terapeutas se resguardarán en la plataforma por un plazo mínimo legal de <strong>5 años</strong> a partir de la fecha de la última consulta del paciente, garantizando la continuidad de la atención profesional del terapeuta.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 10 */}
                        <section id="cookies" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[9].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    SAPIHUM utiliza cookies, balizas web y tecnologías similares de almacenamiento local en su navegador con el fin de habilitar la persistencia de su sesión de acceso seguro, recordar sus preferencias lingüísticas y analizar de forma agregada el tráfico de visitas de marketing a través de herramientas analíticas de terceros (como Google Analytics).
                                </p>
                                <p>
                                    Usted puede bloquear, restringir o deshabilitar las cookies no esenciales a través de las opciones de configuración de seguridad de su navegador de internet. Tenga en cuenta que la desactivación de cookies indispensables podría inhabilitar el inicio de sesión seguro o el funcionamiento de la suite de agenda y videoconsultas de SAPIHUM.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Section 11 */}
                        <section id="contacto-cambios" className="scroll-mt-24 space-y-4">
                            <h2 className="font-sans text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                                {sections[10].title}
                            </h2>
                            <div className="font-sans text-sm leading-7 text-stone-600 space-y-4 dark:text-stone-300">
                                <p>
                                    Para cualquier duda, comentario o reclamación sobre el tratamiento de sus datos personales, o para solicitar aclaraciones sobre este Aviso de Privacidad Integral, nuestra Oficina de Privacidad se encuentra plenamente a su servicio mediante el correo electrónico oficial:
                                </p>
                                <p className="font-bold text-center py-4 bg-stone-100 dark:bg-stone-900 rounded-xl text-stone-900 dark:text-stone-100 font-sans text-base">
                                    privacidad@mail.sapihum.com
                                </p>
                                <p>
                                    <strong>Modificaciones a este Aviso:</strong> SAPIHUM modificará, adaptará o actualizará este Aviso de Privacidad a fin de reflejar cambios legales del sector salud y tecnológico, nuevas funcionalidades de Inteligencia Artificial que se incorporen o regulaciones internacionales vigentes. Cualquier modificación le será notificada mediante publicación directa de la nueva versión con su respectiva fecha en esta misma sección, o por correo electrónico enviado a la dirección asociada a su perfil de usuario.
                                </p>
                            </div>
                        </section>

                        <hr className="border-stone-200 dark:border-stone-800" />

                        {/* Consent Agreement Box */}
                        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
                            <h3 className="font-sans text-lg font-bold text-stone-900 dark:text-stone-100">
                                Consentimiento Expreso de Privacidad
                            </h3>
                            <p className="font-sans text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                                Al registrarse en la plataforma SAPIHUM, enviar datos personales o utilizar las herramientas de agenda, transcripción clínica por Inteligencia Artificial y teleconsulta, usted manifiesta de manera consciente e indubitable haber leído este Aviso de Privacidad Integral y otorga expresamente su consentimiento libre para el tratamiento y transferencia internacional segura de sus datos generales e información clínica sensible conforme a los términos aquí regulados.
                            </p>
                            <div className="pt-2 flex flex-col sm:flex-row gap-4">
                                <Link 
                                    href="/terminos" 
                                    className="inline-flex justify-center items-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    Consultar Términos del Servicio
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
