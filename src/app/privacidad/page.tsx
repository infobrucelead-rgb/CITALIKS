import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Mail, Lock, Eye, FileText, Globe, Bell, UserCheck, Share2, Clock, Trash2, Database, AlertTriangle } from "lucide-react";

export default function PrivacyPolicyPage() {
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
                        <Shield size={12} /> Legal & Privacidad
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Política de <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">Privacidad</span></h1>
                    <p className="text-white/50 text-lg leading-relaxed max-w-2xl">
                        En CitaLiks (Neural 360 SL), nos tomamos muy en serio la protección de tus datos. Esta política explica cómo recopilamos, usamos y protegemos tu información.
                    </p>
                </header>

                {/* Content Sections */}
                <div className="space-y-12 animate-fade-in delay-200">

                    {/* Section 1: Quiénes somos */}
                    <section className="glass rounded-[2rem] p-8 md:p-10 border-white/5 relative overflow-hidden group hover:border-violet-500/20 transition-all">
                        <div className="flex items-start gap-6">
                            <div className="p-4 rounded-2xl bg-violet-600/10 text-violet-400">
                                <Globe size={24} />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold">1. Quiénes somos</h2>
                                <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                                    <p>
                                        La dirección de nuestra web es: <a href="https://neuralads360.com" className="text-violet-400 hover:underline">https://neuralads360.com</a>
                                    </p>
                                    <ul className="space-y-2">
                                        <li><strong className="text-white/80">Titular del sitio web:</strong> Neural 360 SL</li>
                                        <li><strong className="text-white/80">Dirección:</strong> C/ Oriente 2, 28817, Los Santos de la Humosa, Madrid, España</li>
                                        <li><strong className="text-white/80">Correo electrónico de contacto:</strong> info@neuralads360.com</li>
                                    </ul>
                                    <p>
                                        Neural 360 SL es una consultora especializada en sistemas de crecimiento, automatización e inteligencia artificial aplicada al negocio.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Datos que recopilamos */}
                    <section className="glass rounded-[2rem] p-8 md:p-10 border-white/5 relative overflow-hidden group hover:border-blue-500/20 transition-all">
                        <div className="flex items-start gap-6">
                            <div className="p-4 rounded-2xl bg-blue-600/10 text-blue-400">
                                <Eye size={24} />
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">2. Qué datos personales recogemos y por qué</h2>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    Recogemos datos personales únicamente cuando son necesarios para prestar nuestros servicios o responder a solicitudes legítimas de los usuarios.
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h3 className="text-xs uppercase font-black tracking-widest text-white/30">Tipos de datos</h3>
                                        <ul className="space-y-2 text-xs text-white/60 list-disc pl-4">
                                            <li>Nombre y apellidos</li>
                                            <li>Dirección de correo electrónico</li>
                                            <li>Teléfono (si se facilita)</li>
                                            <li>Empresa o proyecto (opcional)</li>
                                            <li>Mensajes enviados a través de formularios</li>
                                            <li>Datos técnicos (IP, navegador, dispositivo)</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xs uppercase font-black tracking-widest text-white/30">Finalidad</h3>
                                        <ul className="space-y-2 text-xs text-white/60 list-disc pl-4">
                                            <li>Responder consultas y solicitudes</li>
                                            <li>Gestionar comunicaciones profesionales</li>
                                            <li>Analizar el uso del sitio para mejorarlo</li>
                                            <li>Seguridad y prevención de abusos</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3-7: Dynamic Content */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="glass rounded-[2rem] p-8 border-white/5 space-y-4">
                            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 w-fit">
                                <Lock size={20} />
                            </div>
                            <h2 className="text-lg font-bold">Seguridad de datos</h2>
                            <p className="text-white/50 text-xs leading-relaxed">
                                Aplicamos medidas técnicas como cifrado SSL, accesos restringidos y monitorización constante para proteger tu información de accesos no autorizados.
                            </p>
                        </div>
                        <div className="glass rounded-[2rem] p-8 border-white/5 space-y-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                                <UserCheck size={20} />
                            </div>
                            <h2 className="text-lg font-bold">Tus Derechos</h2>
                            <p className="text-white/50 text-xs leading-relaxed">
                                Tienes derecho a acceder, rectificar, suprimir u oponerte al tratamiento de tus datos. Escríbenos a info@neuralads360.com para ejercerlos.
                            </p>
                        </div>
                    </div>

                    {/* Main Text Content */}
                    <article className="prose prose-invert prose-sm max-w-none glass rounded-[2.5rem] p-8 md:p-12 border-white/5 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-white font-bold flex items-center gap-2"><Clock size={16} className="text-violet-400" /> Conservación de datos</h3>
                            <p className="text-white/50 leading-relaxed">
                                Los datos de formularios de contacto se conservan hasta 12 meses. Los comentarios se conservan indefinidamente para el seguimiento de la conversación. Los datos técnicos según la configuración de cookies (12-24 meses).
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white font-bold flex items-center gap-2"><Share2 size={16} className="text-blue-400" /> Terceros y Transferencias</h3>
                            <p className="text-white/50 leading-relaxed">
                                No compartimos datos personales con terceros salvo servicios esenciales (hosting, analítica, seguridad). Algunos servicios pueden implicar transferencias fuera de la UE con las garantías legales adecuadas (cláusulas contractuales tipo).
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white font-bold flex items-center gap-2"><AlertTriangle size={16} className="text-orange-400" /> Brechas de Seguridad</h3>
                            <p className="text-white/50 leading-relaxed">
                                Disponemos de protocolos internos para la detección, comunicación y mitigación inmediata en caso de cualquier incidente de seguridad que afecte a los datos.
                            </p>
                        </div>
                    </article>

                    {/* Footer Contact */}
                    <footer className="text-center py-12">
                        <p className="text-white/30 text-xs uppercase font-black tracking-widest mb-6">¿Tienes alguna duda?</p>
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
