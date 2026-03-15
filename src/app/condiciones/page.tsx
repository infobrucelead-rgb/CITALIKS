import React from "react";
import Link from "next/link";
import { Gavel, Mic, ShieldCheck, CreditCard, AlertTriangle, SquarePen, Mail } from "lucide-react";

export default function TermsOfServicePage() {
    return (
        <main className="bg-surface text-on-surface antialiased overflow-x-hidden font-body selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
            {/* Top Navigation */}
            <nav className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant border-opacity-10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="CitaLiks Logo" className="w-8 h-8 object-contain" />
                        <span className="text-2xl font-bold tracking-tighter text-primary">CitaLiks</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/#features" className="text-sm font-medium hover:text-primary transition-colors">Funcionalidades</Link>
                        <Link href="/#pricing" className="text-sm font-medium hover:text-primary transition-colors">Precios</Link>
                    </div>
                    <Link href="/sign-up" className="bg-primary text-on-primary px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all">
                        Probar Gratis
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6">
                {/* Hero Section / Header */}
                <header className="max-w-4xl mx-auto mb-20 text-center md:text-left">
                    <div className="inline-block px-4 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                        Legal & Cumplimiento
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-on-surface mb-8">
                        Términos de Servicio
                    </h1>
                    <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto md:mx-0">
                        Última actualización: Marzo 2026. Estos términos rigen el uso de nuestra plataforma de inteligencia artificial por voz para la gestión de citas.
                    </p>
                </header>

                {/* Content Layout */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Sticky Navigation Side */}
                    <aside className="md:col-span-3 hidden md:block">
                        <div className="sticky top-32 space-y-4 text-sm font-medium">
                            <nav className="flex flex-col gap-2 border-l border-outline-variant">
                                <a className="pl-4 py-1 text-on-surface-variant hover:text-primary hover:border-l-2 hover:border-tertiary-fixed transition-all" href="#aceptacion">1. Aceptación</a>
                                <a className="pl-4 py-1 text-on-surface-variant hover:text-primary hover:border-l-2 hover:border-tertiary-fixed transition-all" href="#uso">2. Uso del Servicio</a>
                                <a className="pl-4 py-1 text-on-surface-variant hover:text-primary hover:border-l-2 hover:border-tertiary-fixed transition-all" href="#propiedad">3. Propiedad</a>
                                <a className="pl-4 py-1 text-on-surface-variant hover:text-primary hover:border-l-2 hover:border-tertiary-fixed transition-all" href="#pagos">4. Pagos</a>
                                <a className="pl-4 py-1 text-on-surface-variant hover:text-primary hover:border-l-2 hover:border-tertiary-fixed transition-all" href="#responsabilidad">5. Responsabilidad</a>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Text Content */}
                    <div className="md:col-span-9 space-y-16">
                        {/* Section 1 */}
                        <section className="scroll-mt-32" id="aceptacion">
                            <div className="bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-sm border border-outline-variant border-opacity-5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-tertiary-fixed">
                                        <Gavel size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">1. Aceptación de los Términos</h2>
                                </div>
                                <div className="space-y-4 text-on-surface-variant leading-relaxed">
                                    <p>Al acceder o utilizar los servicios de CitaLiks, usted acepta estar legalmente vinculado por estos Términos de Servicio. Si no está de acuerdo con alguna parte, no podrá acceder al servicio.</p>
                                    <p>Este acuerdo constituye un contrato vinculante entre usted y Neural 360 SL sobre el uso de nuestra tecnología de agentes de voz.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section className="scroll-mt-32" id="uso">
                            <div className="bg-surface-container-low p-8 md:p-12 rounded-xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-tertiary-fixed">
                                        <Mic size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">2. Descripción y Uso del Servicio</h2>
                                </div>
                                <div className="space-y-4 text-on-surface-variant leading-relaxed text-sm">
                                    <p>CitaLiks proporciona una plataforma que permite a los negocios gestionar sus agendas mediante IA. El uso del servicio implica:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>No utilizar la tecnología para fines fraudulentos o acoso.</li>
                                        <li>Asegurar que el contenido del asistente cumple con las leyes locales.</li>
                                        <li>Mantener la seguridad de su cuenta y credenciales.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section className="scroll-mt-32" id="propiedad">
                            <div className="bg-surface-container-lowest p-8 md:p-12 rounded-xl border border-outline-variant border-opacity-5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-tertiary-fixed">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">3. Propiedad Intelectual</h2>
                                </div>
                                <div className="space-y-4 text-on-surface-variant leading-relaxed">
                                    <p>Neural 360 SL conserva todos los derechos sobre la plataforma, los algoritmos y el software. Usted conserva la propiedad de los datos de su agenda y configuraciones personalizadas.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 4 & 5 Bento Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-primary-container p-8 rounded-xl text-white" id="pagos">
                                <CreditCard className="text-tertiary-fixed mb-4" />
                                <h3 className="text-xl font-bold mb-4">4. Cancelación y Pagos</h3>
                                <p className="text-sm opacity-80 leading-relaxed">
                                    Las suscripciones se facturan según el plan elegido. Puede cancelar en cualquier momento, finalizando el servicio al terminar el periodo ya abonado.
                                </p>
                            </div>
                            <div className="bg-surface-container-high p-8 rounded-xl" id="responsabilidad">
                                <AlertTriangle className="text-primary mb-4" />
                                <h3 className="text-xl font-bold mb-4 text-primary">5. Responsabilidad</h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    No somos responsables de fallos en servicios de terceros o interpretaciones erróneas de la IA, aunque trabajamos para minimizarlos.
                                </p>
                            </div>
                        </div>

                        {/* Section 6 */}
                        <section className="scroll-mt-32" id="modificaciones">
                            <div className="bg-surface-container-lowest p-8 md:p-12 rounded-xl border border-outline-variant border-opacity-5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-tertiary-fixed">
                                        <SquarePen size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">6. Modificaciones</h2>
                                </div>
                                <p className="text-on-surface-variant leading-relaxed text-sm">
                                    Nos reservamos el derecho de modificar estos términos. Notificaremos cambios significativos a través de la plataforma.
                                </p>
                            </div>
                        </section>

                        {/* Contact CTA */}
                        <div className="bg-tertiary-fixed p-1 rounded-xl">
                            <div className="bg-white p-8 md:p-12 rounded-lg flex flex-col items-center text-center justify-between gap-8">
                                <div className="max-w-xl mx-auto">
                                    <h3 className="text-2xl font-bold mb-2">¿Tiene dudas legales?</h3>
                                    <p className="text-on-surface-variant">Nuestro equipo está disponible para resolver cualquier consulta sobre nuestros términos y condiciones.</p>
                                </div>
                                <a className="bg-primary text-black px-12 py-5 rounded-full font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-transform shadow-[0_20px_40px_rgba(32,185,95,0.3)] glow-hover" href="mailto:admin@citaliks.com">
                                    <Mail size={24} />
                                    CONTACTA
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-surface-container-lowest border-t border-outline-variant border-opacity-20 py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center pb-12 border-b border-outline-variant border-opacity-10 gap-6">
                        <span className="text-2xl font-bold tracking-tighter italic">CitaLiks</span>
                        <div className="flex gap-8 text-sm font-medium">
                            <Link className="text-on-surface-variant hover:text-primary" href="/privacidad">Privacidad</Link>
                            <Link className="text-primary font-bold underline decoration-tertiary-fixed decoration-2 underline-offset-4" href="/condiciones">Términos</Link>
                        </div>
                    </div>
                    <p className="mt-12 text-center text-xs text-on-surface-variant opacity-60">© {new Date().getFullYear()} Neural 360 SL. Todos los derechos reservados.</p>
                </div>
            </footer>
        </main>
    );
}
