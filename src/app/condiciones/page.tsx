import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, Mail, Gavel, ShieldCheck, Scale, ScrollText, UserCheck, AlertCircle } from "lucide-react";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-violet-500/30">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-20">
                {/* Header Navigation */}
                <nav className="mb-12 animate-fade-in">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group text-sm font-medium"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver al inicio
                    </Link>
                </nav>

                {/* Hero Section */}
                <header className="mb-16 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest mb-6">
                        <FileText size={12} /> Legal & Términos
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Condiciones del <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">Servicio</span></h1>
                    <p className="text-white/50 text-lg leading-relaxed max-w-2xl">
                        Bienvenido a CitaLiks. Al utilizar nuestra plataforma, aceptas estas condiciones. Por favor, léelas detenidamente para entender tus derechos y responsabilidades.
                    </p>
                </header>

                {/* Content Sections */}
                <div className="space-y-12 animate-fade-in delay-200">

                    {/* Section 1: Aceptación */}
                    <section className="glass rounded-[2rem] p-8 md:p-10 border-white/5 relative overflow-hidden group hover:border-violet-500/20 transition-all">
                        <div className="flex items-start gap-6">
                            <div className="p-4 rounded-2xl bg-violet-600/10 text-violet-400">
                                <Gavel size={24} />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold">1. Aceptación de los Términos</h2>
                                <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                                    <p>
                                        Al acceder o utilizar los servicios de CitaLiks (en adelante, "el Servicio"), proporcionado por Neural 360 SL, aceptas quedar vinculado por estos términos y condiciones. Si no estás de acuerdo con alguna parte de los términos, no podrás acceder al Servicio.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Uso del Servicio */}
                    <section className="glass rounded-[2rem] p-8 md:p-10 border-white/5 relative overflow-hidden group hover:border-blue-500/20 transition-all">
                        <div className="flex items-start gap-6">
                            <div className="p-4 rounded-2xl bg-blue-600/10 text-blue-400">
                                <UserCheck size={24} />
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">2. Descripción y Uso del Servicio</h2>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    CitaLiks ofrece un asistente de voz basado en IA para la gestión de agendas y atención al cliente. El usuario se compromete a:
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h3 className="text-xs uppercase font-black tracking-widest text-white/30">Responsabilidades</h3>
                                        <ul className="space-y-2 text-xs text-white/60 list-disc pl-4">
                                            <li>Mantener la confidencialidad de sus credenciales</li>
                                            <li>Asegurar que el contenido del asistente sea legal</li>
                                            <li>No utilizar el servicio para spam o fines abusivos</li>
                                            <li>Cumplir con las leyes de protección de datos locales</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xs uppercase font-black tracking-widest text-white/30">Nuestras garantías</h3>
                                        <ul className="space-y-2 text-xs text-white/60 list-disc pl-4">
                                            <li>Disponibilidad del 99% del servicio</li>
                                            <li>Actualizaciones de seguridad constantes</li>
                                            <li>Soporte técnico según plan contratado</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3-4: Property and Cancellation */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="glass rounded-[2rem] p-8 border-white/5 space-y-4">
                            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 w-fit">
                                <Scale size={20} />
                            </div>
                            <h2 className="text-lg font-bold">Propiedad Intelectual</h2>
                            <p className="text-white/50 text-xs leading-relaxed">
                                Todo el software, algoritmos y diseños de CitaLiks son propiedad exclusiva de Neural 360 SL. El uso del servicio no otorga propiedad sobre el código o la tecnología subyacente.
                            </p>
                        </div>
                        <div className="glass rounded-[2rem] p-8 border-white/5 space-y-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                                <ShieldCheck size={20} />
                            </div>
                            <h2 className="text-lg font-bold">Cancelación y Pagos</h2>
                            <p className="text-white/50 text-xs leading-relaxed">
                                Los pagos son recurrentes según el plan elegido. Puedes cancelar tu suscripción en cualquier momento, finalizando el servicio al terminar el periodo ya abonado.
                            </p>
                        </div>
                    </div>

                    {/* Main Text Content */}
                    <article className="prose prose-invert prose-sm max-w-none glass rounded-[2.5rem] p-8 md:p-12 border-white/5 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-white font-bold flex items-center gap-2"><ScrollText size={16} className="text-violet-400" /> Limitación de Responsabilidad</h3>
                            <p className="text-white/50 leading-relaxed">
                                Neural 360 SL no se hace responsable de errores en la programación de citas causados por mala configuración del usuario, fallos en servicios de terceros (Google, telefonía) o malentendidos en la interpretación de la voz por parte de la IA, aunque trabajamos constantemente para minimizar estos casos.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white font-bold flex items-center gap-2"><AlertCircle size={16} className="text-orange-400" /> Modificaciones de los Términos</h3>
                            <p className="text-white/50 leading-relaxed">
                                Nos reservamos el derecho de modificar estos términos en cualquier momento. Notificaremos cambios significativos a través de la plataforma o por correo electrónico. El uso continuado tras dichas modificaciones implica la aceptación de los nuevos términos.
                            </p>
                        </div>
                    </article>

                    {/* Footer Contact */}
                    <footer className="text-center py-12">
                        <p className="text-white/30 text-xs uppercase font-black tracking-widest mb-6">Contacto Legal</p>
                        <a
                            href="mailto:info@neuralads360.com"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group lg:text-xl font-bold"
                        >
                            <Mail size={20} className="text-violet-400 group-hover:scale-110 transition-transform" />
                            info@neuralads360.com
                        </a>
                        <p className="text-white/20 text-[10px] mt-12 italic">
                            Última actualización: Marzo 2026
                        </p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
