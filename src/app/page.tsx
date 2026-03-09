import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
    const { userId } = await auth();
    if (userId) redirect("/dashboard");

    return (
        <main className="min-h-screen bg-gradient-animated text-white overflow-hidden">
            {/* Nav */}
            <nav className="flex flex-wrap flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 px-8 py-6 max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
                    <img src="/logo.png" alt="CitaLiks Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
                    <span className="text-xl font-bold">Cita <span className="gradient-text">Liks</span></span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/sign-in" className="text-sm text-white/60 hover:text-white transition-colors">
                        Iniciar sesión
                    </Link>
                    <Link
                        href="/sign-up"
                        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-all hover:shadow-lg hover:shadow-violet-500/25"
                    >
                        Empezar gratis
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-violet-300 mb-8 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Tu asistente de voz ya está disponible
                </div>
                <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in">
                    Tu agenda, gestionada{" "}
                    <span className="gradient-text">por IA</span>
                </h1>
                <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 animate-fade-in">
                    Un asistente telefónico en Español que atiende llamadas, reserva citas y gestiona tu Google Calendar — 24 horas al día, sin que tú intervengas.
                </p>
                <div className="flex items-center justify-center gap-4 animate-fade-in">
                    <Link
                        href="/sign-up"
                        className="px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 font-semibold text-lg transition-all hover:shadow-xl hover:shadow-violet-500/30 glow-purple"
                    >
                        Crear mi asistente →
                    </Link>
                    <span className="text-white/40 text-sm">Sin tarjeta de crédito</span>
                </div>
            </section>

            {/* Features grid */}
            <section className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: "📞", title: "Número +34 propio", desc: "Cada cliente recibe un número de teléfono español exclusivo para su negocio." },
                    { icon: "🤖", title: "IA en Español natural", desc: "Tu agente habla Español de España con voz realista. Nadie sabrá que es IA." },
                    { icon: "📅", title: "Google Calendar sincronizado", desc: "Crea, modifica y cancela citas directamente en tu agenda de Google." },
                    { icon: "🔀", title: "Transferencia a humano", desc: "Si el cliente lo necesita, la llamada se transfiere a ti automáticamente." },
                    { icon: "📊", title: "Dashboard de llamadas", desc: "Consulta transcripciones, resúmenes y estadísticas de todas las llamadas." },
                    { icon: "⚡", title: "Listo en 5 minutos", desc: "Onboarding guiado paso a paso. Tu agente activo en minutos, no días." },
                ].map((f) => (
                    <div key={f.title} className="glass rounded-2xl p-6 hover:border-violet-500/30 transition-all group">
                        <span className="text-3xl mb-4 block">{f.icon}</span>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-violet-300 transition-colors">{f.title}</h3>
                        <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </section>

            {/* Pricing */}
            <section className="max-w-6xl mx-auto px-8 py-20">
                <div className="text-center mb-14">
                    <h2 className="text-4xl font-bold mb-4">Planes y precios</h2>
                    <p className="text-white/50 text-lg max-w-xl mx-auto">
                        Mismas funcionalidades en todos los planes. La diferencia está en la duración del contrato y el coste de implementación.
                    </p>
                </div>

                {/* Core features shared by all plans */}
                <div className="glass rounded-2xl px-8 py-6 mb-10 border border-white/10">
                    <p className="text-xs uppercase font-black text-white/30 tracking-widest mb-4">✅ Incluido en todos los planes</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-white/60">
                        {[
                            "Asistente de voz IA en Español",
                            "Número +34 exclusivo",
                            "Reserva, cancela y reagenda citas",
                            "Sincronización Google Calendar",
                            "SMS de confirmación automático",
                            "Recordatorios automáticos de cita",
                            "Transferencia de llamada al equipo",
                            "Alertas SMS de oportunidades de venta",
                            "Múltiples profesionales / agenda",
                            "Dashboard de llamadas y transcripciones",
                            "Soporte por email",
                            "Sin límite de llamadas",
                        ].map((f) => (
                            <div key={f} className="flex items-start gap-2">
                                <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {/* BASIC */}
                    <div className="glass rounded-3xl p-8 flex flex-col gap-6 border border-white/10 hover:border-violet-500/30 transition-all">
                        <div>
                            <span className="text-xs uppercase font-black text-white/30 tracking-widest">Basic</span>
                            <div className="mt-3 flex items-end gap-2">
                                <span className="text-5xl font-black">99€</span>
                                <span className="text-white/40 mb-1 text-sm">implementación</span>
                            </div>
                            <p className="text-white/40 text-xs mt-1">+ 99€/mes · Contrato 12 meses</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-white/40 mb-3">
                                Ideal para negocios que buscan el mejor precio comprometiéndose a largo plazo.
                            </p>
                            <div className="rounded-xl bg-white/5 px-4 py-3 text-xs text-white/50">
                                🎯 Todas las funcionalidades incluidas · Ahorro máximo en implementación
                            </div>
                        </div>
                        <Link href="/sign-up" className="block text-center px-6 py-3 rounded-2xl border border-violet-500/40 hover:border-violet-400 hover:bg-violet-500/10 font-semibold transition-all text-sm">
                            Empezar con Basic →
                        </Link>
                    </div>

                    {/* BUSINESS */}
                    <div className="glass rounded-3xl p-8 flex flex-col gap-6 border border-violet-500/60 relative shadow-xl shadow-violet-500/10 hover:border-violet-400/80 transition-all">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <span className="px-4 py-1.5 rounded-full bg-violet-600 text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-500/40">Más popular</span>
                        </div>
                        <div>
                            <span className="text-xs uppercase font-black text-violet-400 tracking-widest">Business</span>
                            <div className="mt-3 flex items-end gap-2">
                                <span className="text-5xl font-black">119€</span>
                                <span className="text-white/40 mb-1 text-sm">implementación</span>
                            </div>
                            <p className="text-white/40 text-xs mt-1">+ 99€/mes · Contrato 6 meses</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-white/40 mb-3">
                                El equilibrio perfecto entre flexibilidad y ahorro. El favorito de nuestros clientes.
                            </p>
                            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-3 text-xs text-violet-300">
                                🎯 Todas las funcionalidades incluidas · 6 meses de compromiso
                            </div>
                        </div>
                        <Link href="/sign-up" className="block text-center px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 font-semibold transition-all text-sm glow-purple shadow-lg shadow-violet-500/30">
                            Empezar con Business →
                        </Link>
                    </div>

                    {/* PREMIUM */}
                    <div className="glass rounded-3xl p-8 flex flex-col gap-6 border border-white/10 hover:border-amber-500/30 transition-all">
                        <div>
                            <span className="text-xs uppercase font-black text-amber-400/70 tracking-widest">Premium</span>
                            <div className="mt-3 flex items-end gap-2">
                                <span className="text-5xl font-black">149€</span>
                                <span className="text-white/40 mb-1 text-sm">implementación</span>
                            </div>
                            <p className="text-white/40 text-xs mt-1">+ 99€/mes · Contrato 3 meses</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-white/40 mb-3">
                                Máxima flexibilidad con soporte técnico avanzado e integraciones a medida.
                            </p>
                            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-xs text-amber-300/80 flex flex-col gap-1.5">
                                <span className="font-semibold">⭐ Todo lo anterior, más:</span>
                                <span>🔗 Integraciones CRM / ERP a medida</span>
                                <span>🎫 Soporte técnico prioritario por tickets</span>
                                <span>📞 Onboarding por videollamada</span>
                            </div>
                        </div>
                        <Link href="/sign-up" className="block text-center px-6 py-3 rounded-2xl border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/10 font-semibold transition-all text-sm">
                            Empezar con Premium →
                        </Link>
                    </div>
                </div>

                <p className="text-center text-white/30 text-xs mt-10">
                    ¿Necesitas integraciones especiales?{" "}
                    <a href="mailto:neuralads.mkt@gmail.com" className="text-violet-400 hover:text-violet-300 underline">
                        Contáctanos
                    </a>{" "}
                    y te preparamos un presupuesto a medida.
                </p>
            </section>

            {/* CTA final */}
            <section className="max-w-3xl mx-auto px-8 pt-8 pb-24 text-center">
                <div className="glass rounded-3xl p-10">
                    <h2 className="text-3xl font-bold mb-4">¿Listo para empezar?</h2>
                    <p className="text-white/60 mb-8">Configura tu asistente en 5 minutos. Sin contratos, cancela cuando quieras.</p>
                    <Link
                        href="/sign-up"
                        className="inline-block px-10 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 font-semibold text-lg transition-all hover:shadow-xl hover:shadow-violet-500/30"
                    >
                        Empezar ahora →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 mt-auto py-8">
                <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
                    <p>© {new Date().getFullYear()} NeuralAds360. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacidad" className="hover:text-white transition-colors">
                            Política de Privacidad
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
