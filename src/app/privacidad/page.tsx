import React from "react";
import Link from "next/link";
import { Scale, ShieldCheck, Mail, Gavel, Database, Building2, History, Languages, AlertTriangle, Eye, SquarePen, Trash2 } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <main className="bg-surface text-on-surface antialiased overflow-x-hidden font-body">
            {/* Top Navigation */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-7xl">
                <div className="glass-nav px-8 py-4 rounded-full flex items-center justify-between shadow-sm">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="CitaLiks Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain logo-neon" />
                        <span className="text-xl md:text-2xl font-black tracking-tighter text-primary font-logo">CitaLiks</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-10">
                        <Link href="/#features" className="text-sm font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-all">Funcionalidades</Link>
                        <Link href="/#pricing" className="text-sm font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-all">Precios</Link>
                    </div>
                    <Link href="https://calendly.com/citaliks/30min" target="_blank" className="bg-primary text-black px-5 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-sm font-black glow-hover transition-all uppercase tracking-widest whitespace-nowrap">
                        Probar Gratis
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-40 pb-20 hero-gradient text-white overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="max-w-3xl">
                        <span className="inline-block px-4 py-1 rounded-full bg-tertiary-fixed/20 text-tertiary-fixed text-xs font-bold tracking-widest uppercase mb-6">Legal & Transparencia</span>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[1.1]">Política de Privacidad</h1>
                        <p className="text-xl text-primary-fixed-dim leading-relaxed font-light">
                            En CitaLiks, la seguridad de su voz y sus datos es nuestra prioridad fundamental. Este documento detalla nuestro compromiso con la transparencia y el cumplimiento normativo.
                        </p>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tertiary-fixed/10 blur-[120px] rounded-full"></div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Sidebar Navigation */}
                    <aside className="lg:col-span-3 hidden lg:block sticky top-32 h-fit">
                        <nav className="flex flex-col gap-4 border-l border-outline-variant/30 pl-6 text-sm">
                            <a className="font-medium text-on-surface-variant hover:text-primary transition-colors" href="#quienes-somos">1. Quiénes somos</a>
                            <a className="font-medium text-on-surface-variant hover:text-primary transition-colors" href="#datos">2. Recogida de datos</a>
                            <a className="font-medium text-on-surface-variant hover:text-primary transition-colors" href="#seguridad">3. Seguridad</a>
                            <a className="font-medium text-on-surface-variant hover:text-primary transition-colors" href="#derechos">4. Sus Derechos</a>
                            <a className="font-medium text-on-surface-variant hover:text-primary transition-colors" href="#conservacion">5. Conservación</a>
                            <a className="font-medium text-on-surface-variant hover:text-primary transition-colors" href="#terceros">6. Transferencias</a>
                            <a className="font-medium text-on-surface-variant hover:text-primary transition-colors" href="#brechas">7. Brechas de Seguridad</a>
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <div className="lg:col-span-9 space-y-24">
                        {/* Section 1 */}
                        <section className="scroll-mt-32" id="quienes-somos">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/5 rounded-lg text-white">
                                    <Building2 size={24} />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight">1. Quiénes somos</h2>
                            </div>
                            <div className="bg-surface-container-low p-8 rounded-xl leading-relaxed text-on-surface-variant space-y-4">
                                <p>CitaLiks, operando bajo la matriz tecnológica de Neural 360 SL, es el responsable del tratamiento de sus datos personales. Nuestra misión es proporcionar soluciones de inteligencia artificial de voz líderes en la industria manteniendo los más altos estándares de privacidad.</p>
                                <p><strong>Titular:</strong> Neural 360 SL</p>
                                <p><strong>Dirección:</strong> C/ Oriente 2, 28817, Los Santos de la Humosa, Madrid, España</p>
                                <p>Para cualquier consulta legal o de privacidad, puede contactar con nuestro Delegado de Protección de Datos en: <strong className="text-primary">admin@citaliks.com</strong></p>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section className="scroll-mt-32" id="datos">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-white/5 rounded-lg text-white">
                                    <Database size={24} />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight">2. Qué datos personales recogemos y por qué</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-sm">
                                    <h3 className="text-xl font-bold mb-4">Datos de Audio</h3>
                                    <p className="text-on-surface-variant text-sm leading-relaxed mb-4">Procesamos grabaciones de voz para convertirlas en texto o generar respuestas mediante IA. Estos datos son cifrados inmediatamente.</p>
                                    <span className="text-xs font-bold text-secondary-fixed-variant uppercase tracking-widest">Base legal: Ejecución de contrato</span>
                                </div>
                                <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-sm">
                                    <h3 className="text-xl font-bold mb-4">Identificadores</h3>
                                    <p className="text-on-surface-variant text-sm leading-relaxed mb-4">Nombre, correo electrónico y credenciales de acceso para gestionar su cuenta y personalizar su experiencia en la plataforma.</p>
                                    <span className="text-xs font-bold text-secondary-fixed-variant uppercase tracking-widest">Base legal: Consentimiento</span>
                                </div>
                                <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-sm md:col-span-2">
                                    <h3 className="text-xl font-bold mb-4">Uso de la Plataforma</h3>
                                    <p className="text-on-surface-variant text-sm leading-relaxed mb-4">Recopilamos metadatos sobre cómo interactúa con nuestro sistema para mejorar algoritmos de latencia y precisión vocal. No vendemos estos datos a terceros bajo ninguna circunstancia.</p>
                                    <span className="text-xs font-bold text-secondary-fixed-variant uppercase tracking-widest">Base legal: Interés legítimo</span>
                                </div>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section className="scroll-mt-32" id="seguridad">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/5 rounded-lg text-white">
                                    <ShieldCheck size={24} />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight">3. Seguridad de datos</h2>
                            </div>
                            <div className="bg-primary-container text-white p-10 rounded-2xl relative overflow-hidden">
                                <div className="relative z-10 grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 text-tertiary-fixed">Cifrado de grado militar</h3>
                                        <p className="text-primary-fixed-dim leading-relaxed">Implementamos protocolos AES-256 para datos en reposo y TLS 1.3 para datos en tránsito. Su voz nunca viaja sin protección.</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 text-tertiary-fixed">Infraestructura Aislada</h3>
                                        <p className="text-primary-fixed-dim leading-relaxed">Los modelos de entrenamiento están aislados físicamente de los datos de producción identificables de los usuarios.</p>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20"></div>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section className="scroll-mt-32" id="derechos">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/5 rounded-lg text-white">
                                    <Gavel size={24} />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight">4. Tus Derechos</h2>
                            </div>
                            <p className="text-on-surface-variant mb-8 font-medium">Usted tiene el control total sobre su información:</p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 hover:bg-surface-container-low transition-colors rounded-xl group">
                                    <Eye className="text-outline group-hover:text-primary shrink-0" />
                                    <div>
                                        <h4 className="font-bold">Acceso y Portabilidad</h4>
                                        <p className="text-sm text-on-surface-variant">Solicite una copia de todos los datos que tenemos sobre usted en un formato estructurado.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 hover:bg-surface-container-low transition-colors rounded-xl group">
                                    <SquarePen className="text-outline group-hover:text-primary shrink-0" />
                                    <div>
                                        <h4 className="font-bold">Rectificación</h4>
                                        <p className="text-sm text-on-surface-variant">Corrija cualquier información inexacta o incompleta en su perfil.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 hover:bg-surface-container-low transition-colors rounded-xl group">
                                    <Trash2 className="text-outline group-hover:text-error shrink-0" />
                                    <div>
                                        <h4 className="font-bold">Derecho al Olvido</h4>
                                        <p className="text-sm text-on-surface-variant">Solicite la eliminación permanente de sus grabaciones y datos personales de nuestros servidores.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 5 & 6 Row */}
                        <div className="grid md:grid-cols-2 gap-12">
                            <section className="scroll-mt-32" id="conservacion">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/5 rounded-lg text-white">
                                        <History size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">5. Conservación</h2>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Mantenemos sus datos solo mientras sea necesario para prestar el servicio o cumplir con obligaciones legales. Las grabaciones temporales se eliminan tras 30 días.
                                </p>
                            </section>
                            <section className="scroll-mt-32" id="terceros">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/5 rounded-lg text-white">
                                        <Languages size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">6. Terceros</h2>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    Podemos utilizar proveedores de infraestructura (como AWS o Google Cloud) localizados en regiones seguras. No compartimos datos con redes publicitarias.
                                </p>
                            </section>
                        </div>

                        {/* Section 7 */}
                        <section className="scroll-mt-32 border-t border-outline-variant/30 pt-16" id="brechas">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-error-container/30 rounded-lg text-error">
                                    <AlertTriangle size={24} />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight">7. Brechas de Seguridad</h2>
                            </div>
                            <div className="bg-surface-container-low p-8 rounded-xl border border-error/10">
                                <p className="text-on-surface-variant leading-relaxed">
                                    En el caso de una brecha de seguridad que afecte a sus datos, CitaLiks se compromete a notificar a las autoridades y a los usuarios afectados en un plazo de <span className="font-bold text-primary">72 horas</span>.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Bottom Action Area */}
            <section className="max-w-7xl mx-auto px-6 mb-24">
                <div className="bg-tertiary-fixed text-on-tertiary-fixed p-12 rounded-[2rem] text-center shadow-lg">
                    <h2 className="text-3xl font-bold mb-4">¿Preguntas sobre su privacidad?</h2>
                    <p className="mb-8 opacity-80 max-w-xl mx-auto text-lg leading-relaxed">Nuestro equipo legal está disponible para resolver cualquier duda sobre el tratamiento de sus datos.</p>
                    <a className="inline-flex items-center gap-3 bg-primary text-black px-12 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_20px_40px_rgba(32,185,95,0.3)] glow-hover" href="mailto:admin@citaliks.com">
                        <Mail size={24} />
                        CONTACTA
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black py-24 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 border-b border-white/5 pb-16 mb-16">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="CitaLiks Logo" className="w-10 h-10 object-contain logo-neon" />
                            <span className="text-2xl font-black tracking-tighter text-white">CitaLiks</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                            <Link href="/#features" className="hover:text-primary transition-colors">Funciones</Link>
                            <Link href="/#pricing" className="hover:text-primary transition-colors">Precios</Link>
                            <Link href="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
                            <Link href="/condiciones" className="hover:text-primary transition-colors">Términos</Link>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center text-xs font-bold text-white/40 uppercase tracking-widest">
                        <p>© {new Date().getFullYear()} CitaLiks Solution. Todos los derechos reservados.</p>
                        <div className="flex gap-10 mt-8 md:mt-0">
                            <Link className="hover:text-primary transition-colors" href="/privacidad">Legal</Link>
                            <Link className="hover:text-primary transition-colors" href="/condiciones">Cookies</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}

