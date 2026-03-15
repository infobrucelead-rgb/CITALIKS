import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SalesChatWidget from "@/components/SalesChatWidget";
import { getPlanById } from "@/config/pricing";
import LostCallsCalculator from "@/components/LostCallsCalculator";
import InteractiveDemo from "@/components/InteractiveDemo";
import DashboardPreview from "@/components/DashboardPreview";
import PulsatingLogo from "@/components/PulsatingLogo";
import PricingCheckoutButton from "@/components/PricingCheckoutButton";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Play } from "lucide-react";

export default async function HomePage() {
    // Client Component transition complete
    const { userId } = await auth();
    if (userId) redirect("/dashboard");

    const basicPlan = getPlanById('basic');
    const businessPlan = getPlanById('business');
    const premiumPlan = getPlanById('premium');
    const calendlyUrl = process.env.CALENDLY_URL || "https://calendly.com/citaliks/30min";

    return (
        <main className="bg-surface text-on-surface antialiased overflow-x-hidden font-body safe-bottom">
            <MobileBottomNav />
            {/* Top Navigation */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-7xl">
                <div className="glass-nav px-8 py-4 rounded-full flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3 group cursor-pointer shrink-0">
                        <img src="/logo.png" alt="CitaLiks - Automatización de Citas con Inteligencia Artificial" className="w-8 h-8 md:w-10 md:h-10 object-contain logo-neon" />
                        <span className="text-xl md:text-2xl font-black tracking-tighter text-primary font-logo">CitaLiks</span>
                    </div>
                    <div className="hidden md:flex items-center gap-10">
                        <a className="text-sm font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-all underline-offset-8 hover:underline" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }} href="#features">Funcionalidades</a>
                        <a className="text-sm font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-all underline-offset-8 hover:underline" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }} href="#pricing">Precios</a>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <Link href="/sign-in" className="hidden lg:block text-xs md:text-sm font-black uppercase tracking-widest bg-white/10 text-white/80 px-4 py-2 rounded-lg border border-black hover:bg-white/20 hover:text-white transition-all">Iniciar Sesión</Link>
                        <Link href={calendlyUrl} target="_blank" className="bg-primary text-black px-5 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-sm font-black glow-hover transition-all uppercase tracking-widest whitespace-nowrap app-touch-target active-feedback">Pruébalo Gratis</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 md:pt-52 pb-32 px-6 bg-surface relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
                    <div className="space-y-10 mobile-portrait-center flex flex-col items-center lg:items-start text-center lg:text-left">
                        <div className="flex flex-col items-center lg:items-start gap-4">
                            <div className="text-primary text-[10px] md:text-xs font-black tracking-[0.3em] uppercase mb-2">
                                Excelencia técnica a tu servicio
                            </div>
                            <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black tracking-[0.2em] uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                IA de Próxima Generación
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-8xl font-black text-white leading-[0.95] tracking-tightest uppercase italic">
                            Recepcionista virtual para <br/>
                            <span className="text-primary italic text-6xl md:text-9xl">Tu Negocio</span> <br/>
                            <span className="text-primary italic">24/7</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed font-medium">
                            Automatiza tu recepción con el software de reservas con IA más avanzado. Agenda citas, resuelve dudas y capta clientes automáticamente.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 w-full">
                            <Link href={calendlyUrl} target="_blank" className="w-full sm:w-auto bg-primary text-black px-10 py-5 rounded-2xl text-lg font-black shadow-[0_20px_40px_rgba(32,185,95,0.3)] hover:scale-105 transition-all text-center uppercase tracking-widest active:scale-95 glow-hover app-touch-target active-feedback">
                                Probar 20 días gratis
                            </Link>
                            <Link href="/demo" className="w-full sm:w-auto bg-white/5 border border-white/10 px-10 py-5 rounded-2xl text-lg font-black text-white transition-all flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 app-touch-target active-feedback">
                                <Play size={24} className="text-primary" />
                                Demo en vivo
                            </Link>
                        </div>
                        
                        <div className="flex items-center justify-center gap-12 pt-12 border-t border-white/5">
                            <div className="space-y-1 text-center">
                                <p className="text-[28px] md:text-[32px] font-black text-white tracking-tighter leading-none">99%</p>
                                <p className="text-[11px] uppercase font-black tracking-widest text-white/40">Precisión vocal</p>
                            </div>
                            <div className="space-y-1 text-center">
                                <p className="text-[28px] md:text-[32px] font-black text-white tracking-tighter leading-none">5 min</p>
                                <p className="text-[11px] uppercase font-black tracking-widest text-white/40">Instalación rápida</p>
                            </div>
                            <div className="space-y-1 text-center">
                                <p className="text-[28px] md:text-[32px] font-black text-white tracking-tighter leading-none">24/7</p>
                                <p className="text-[11px] uppercase font-black tracking-widest text-white/40">Atención total</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-10 bg-primary/20 rounded-[5rem] blur-[120px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" />
                        <div className="aspect-[4/3] rounded-[4rem] overflow-hidden relief-premium relative z-10 border border-white/10">
                            <img 
                                alt="Futuristic AI interface" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" 
                                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                            <div className="absolute bottom-12 left-12 right-12 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-white font-black uppercase text-[10px] tracking-widest opacity-60">Status</p>
                                    <p className="text-primary font-black text-sm uppercase tracking-widest">Carolina Conectada</p>
                                </div>
                                <div className="flex gap-2 h-8 items-end pb-1">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="w-1 bg-primary/40 rounded-full h-[40%] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section id="features" className="py-24 bg-surface-container-low">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-16 mobile-portrait-center flex flex-col items-center lg:items-start text-center lg:text-left">
                        <span className="text-label text-on-secondary-fixed-variant font-bold tracking-widest uppercase text-sm">El Desafío</span>
                        <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">Software de Reservas con IA: ¿Por qué usarlo?</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center text-center space-y-4 shadow-sm border border-white/5 hover:border-primary/20 transition-all">
                            <span className="material-symbols-outlined text-primary text-6xl">phone_missed</span>
                            <h3 className="text-xl font-bold text-primary">Pierdes llamadas cuando estás ocupado</h3>
                            <p className="text-on-surface-variant leading-relaxed text-sm">Cada llamada perdida es un cliente potencial que se va a la competencia.</p>
                        </div>
                        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center text-center space-y-4 shadow-sm border border-white/5 hover:border-primary/20 transition-all">
                            <span className="material-symbols-outlined text-primary text-6xl">calendar_today</span>
                            <h3 className="text-xl font-bold text-primary">Clientes no pueden reservar</h3>
                            <p className="text-on-surface-variant leading-relaxed text-sm">Dificultad para encontrar huecos o esperar a que alguien responda.</p>
                        </div>
                        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center text-center space-y-4 shadow-sm border border-white/5 hover:border-primary/20 transition-all">
                            <span className="material-symbols-outlined text-primary text-6xl">event_busy</span>
                            <h3 className="text-xl font-bold text-primary">Cancelaciones sin aviso</h3>
                            <p className="text-on-surface-variant leading-relaxed text-sm">Huecos en la agenda que nadie avisó y que suponen pérdida de ingresos.</p>
                        </div>
                        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center text-center space-y-4 shadow-sm border border-white/5 hover:border-primary/20 transition-all">
                            <span className="material-symbols-outlined text-primary text-6xl">view_agenda</span>
                            <h3 className="text-xl font-bold text-primary">Agenda desorganizada</h3>
                            <p className="text-on-surface-variant leading-relaxed text-sm">Papeles, chats sueltos y falta de control sobre tus próximos servicios.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Features Section */}
            <section className="py-32 bg-surface">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24 space-y-6">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80">Excelencia técnica a tu servicio</p>
                        <h2 className="text-4xl md:text-7xl font-black tracking-tight text-white uppercase italic">Recepcionista Virtual para Negocios</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { 
                                name: "Google Calendar", 
                                desc: "Sincronización bidireccional en tiempo real.",
                                icon: (
                                    <svg viewBox="0 0 24 24" className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="4" width="18" height="18" rx="4" />
                                        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                                        <path d="M7 14h2m2 0h2m2 0h2M7 18h2m2 0h2" strokeLinecap="round" opacity="0.5" />
                                    </svg>
                                ), 
                                color: "#20B95F" 
                            },
                            { 
                                name: "Auditorías de Voz", 
                                desc: "Transcripciones y análisis de sentimiento.",
                                icon: (
                                    <svg viewBox="0 0 24 24" className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                                        <path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8" strokeLinecap="round" />
                                    </svg>
                                ), 
                                color: "#20B95F" 
                            },
                            { 
                                name: "IA Bespoke", 
                                desc: "Entrenada específicamente con tus datos.",
                                icon: (
                                    <svg viewBox="0 0 24 24" className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" />
                                    </svg>
                                ), 
                                color: "#20B95F" 
                            },
                            { 
                                name: "Dashboard Pro", 
                                desc: "Control total de tu negocio desde un panel.",
                                icon: (
                                    <svg viewBox="0 0 24 24" className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" rx="4" />
                                        <path d="M3 11h18M9 11v10" strokeLinecap="round" />
                                    </svg>
                                ), 
                                color: "#20B95F" 
                            },
                        ].map((item) => (
                            <div key={item.name} className="group bg-surface-container-low p-12 rounded-[3.5rem] relief-premium hover:scale-[1.02] transition-all duration-500 flex flex-col items-center text-center space-y-10 border border-white/5">
                                <div className="w-28 h-28 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 shadow-inner group-hover:scale-110 logo-neon bg-primary/10 text-primary">
                                    {React.cloneElement(item.icon as React.ReactElement, { className: "w-14 h-14" })}
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-black text-base uppercase tracking-widest text-primary">{item.name}</h4>
                                    <p className="text-sm text-white/40 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works & Interactive Demo */}
            <section className="py-32 bg-surface">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                            <h2 className="text-4xl font-bold tracking-tight">Cómo funciona la Automatización de Citas</h2>
                            <p className="text-white/60 text-lg leading-relaxed font-medium">
                                CitaLiks es un **asistente de voz con IA** diseñado para revolucionar tu recepción. Carolina utiliza algoritmos avanzados para entender y procesar cada llamada, integrándose con tu agenda de forma fluida y natural, actuando como un miembro más de tu equipo humano 24/7.
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-fixed/20 text-on-tertiary-fixed-variant text-xs font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm">phone_android</span>
                                y sin cambiar de número de teléfono
                            </div>
                            <div className="space-y-10">
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center font-bold shrink-0">1</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Conecta tu agenda en minutos</h4>
                                        <p className="text-on-surface-variant">Sincronización total con Google Calendar, Outlook o tu software de gestión actual.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center font-bold shrink-0">2</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">El asistente responde y gestiona</h4>
                                        <p className="text-on-surface-variant">Atiende llamadas, responde dudas frecuentes y propone huecos libres automáticamente.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center font-bold shrink-0">3</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Reservas organizadas</h4>
                                        <p className="text-on-surface-variant">Recibe notificaciones instantáneas de cada nueva cita confirmada en tu panel.</p>
                                    </div>
                                </div>
                            </div>
                            <Link href={calendlyUrl} target="_blank" className="bg-primary text-black px-8 py-4 rounded-xl text-lg font-black glow-hover mt-4 inline-block uppercase tracking-widest active:scale-95">
                                Probar gratis 20 días
                            </Link>
                        </div>
                        <InteractiveDemo />
                    </div>
                </div>
            </section>

            {/* Calculator Section */}
            <section className="py-24 bg-surface-container-low overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <LostCallsCalculator />
                </div>
            </section>

            {/* Dashboard Demo Area */}
            <section className="py-32 bg-surface">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Tu Gestión de Citas organizada en un solo panel</h2>
                    <DashboardPreview />
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 bg-primary-container text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black uppercase italic tracking-tightest mb-4">Planes transparentes</h2>
                        <p className="text-white/60 max-w-2xl mx-auto font-medium">Soluciones escalables para que tu negocio nunca deje de crecer.</p>
                    </div>
                    {/* Included in all plans */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-16">
                        <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-4">
                            <span className="material-symbols-outlined text-primary">check_box</span>
                            <span className="text-sm font-black uppercase tracking-widest text-white/80">INCLUIDO EN TODOS LOS PLANES</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                            {[
                                "Asistente de voz IA en Español", "Número +34 exclusivo", "Reserva, cancela y reagenda citas",
                                "Sincronización Google Calendar", "SMS de confirmación automático", "Recordatorios automáticos de cita",
                                "Transferencia de llamada al equipo", "Alertas SMS de oportunidades", "Múltiples profesionales / agenda",
                                "Dashboard y transcripciones", "Soporte por email", "Llamadas extra a precio reducido"
                            ].map((f) => (
                                <div key={f} className="flex items-start gap-3 text-sm">
                                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">check</span>
                                    <span className="text-white/70 font-medium">{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-8 items-stretch">
                        {/* Plan Basic */}
                        <div className="bg-white/5 border border-white/10 p-10 rounded-2xl flex flex-col group hover:bg-white/10 transition-all duration-300">
                            <div className="mb-8">
                                <span className="text-xs font-black tracking-widest uppercase opacity-60">BASIC</span>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-5xl font-extrabold tracking-tight">{basicPlan?.setupFee}€</span>
                                    <span className="text-sm text-on-primary-container">implementación</span>
                                </div>
                                <p className="text-xs font-black text-primary mt-2 group-hover:animate-pulse">+ {basicPlan?.priceMonthly}€/mes · Contrato {basicPlan?.commitmentMonths} meses</p>
                            </div>
                            <p className="text-white/50 text-sm leading-relaxed mb-8 flex-1 font-medium">
                                Ideal para negocios pequeños. Incluye hasta <span className="text-white font-bold">100 llamadas/mes</span>.
                            </p>
                            <PricingCheckoutButton 
                                planId="basic" 
                                label="Empezar con Basic" 
                                variant="secondary" 
                            />
                        </div>
                        {/* Plan Business */}
                        <div className="bg-white/10 border-2 border-primary/50 p-10 rounded-2xl flex flex-col relative scale-105 shadow-2xl z-10">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(32,185,95,0.4)]">
                                MÁS POPULAR
                            </div>
                            <div className="mb-8">
                                <span className="text-xs font-black tracking-widest uppercase text-primary">BUSINESS</span>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-5xl font-extrabold tracking-tight">{businessPlan?.setupFee}€</span>
                                    <span className="text-sm text-on-primary-container">implementación</span>
                                </div>
                                <p className="text-xs font-black text-primary mt-2">+ {businessPlan?.priceMonthly}€/mes · Contrato {businessPlan?.commitmentMonths} meses</p>
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed mb-8 flex-1 font-semibold">
                                El equilibrio perfecto. Incluye hasta <span className="text-white font-bold">300 llamadas/mes</span>. El favorito de nuestros clientes.
                            </p>
                            <PricingCheckoutButton 
                                planId="business" 
                                label="Empezar con Business" 
                                variant="primary" 
                            />
                        </div>
                        {/* Plan Premium */}
                        <div className="bg-white/5 border border-white/10 p-10 rounded-2xl flex flex-col group hover:bg-white/10 transition-all duration-300">
                            <div className="mb-8">
                                <span className="text-xs font-black tracking-widest uppercase opacity-60">PREMIUM</span>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-5xl font-extrabold tracking-tight">{premiumPlan?.setupFee}€</span>
                                    <span className="text-sm text-on-primary-container">implementación</span>
                                </div>
                                <p className="text-xs font-black text-primary mt-2">+ {premiumPlan?.priceMonthly}€/mes · Contrato {premiumPlan?.commitmentMonths} meses</p>
                            </div>
                            <p className="text-white/50 text-sm leading-relaxed mb-6 flex-1 font-medium">
                                Máxima capacidad. Incluye hasta <span className="text-white font-bold">1000 llamadas/mes</span> y soporte prioritario.
                            </p>
                            <PricingCheckoutButton 
                                planId="premium" 
                                label="Empezar con Premium" 
                                variant="secondary" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-44 relative overflow-hidden bg-surface">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="bg-surface-container rounded-[4rem] p-16 md:p-32 text-center relative overflow-hidden relief-premium">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[140px] opacity-30 -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="relative z-10 space-y-12">
                            <div className="flex flex-col items-center space-y-6">
                                <PulsatingLogo />
                                <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black tracking-[0.3em] uppercase">
                                    Oferta de lanzamiento
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <h2 className="text-5xl md:text-8xl font-black text-white tracking-tightest uppercase italic leading-none">
                                    Tu asistente <br/>
                                    <span className="text-primary italic">está listo</span>
                                </h2>
                                <p className="text-white/60 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                                    Configuración asistida en 5 minutos. Tu asistente personalizado con el nombre de tu negocio y la voz de Carolina.
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-10">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-primary rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                    <Link 
                                        href={calendlyUrl} 
                                        target="_blank"
                                        className="relative bg-white text-black px-16 py-7 rounded-2xl text-2xl font-black hover:scale-105 transition-transform flex items-center gap-4 uppercase tracking-widest shadow-2xl"
                                    >
                                        Empezar ahora
                                    </Link>
                                </div>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center gap-2 text-primary">
                                        {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                                    </div>
                                    <span className="text-white font-black text-sm uppercase tracking-widest leading-none">20 días totalmente gratis</span>
                                    <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest mt-1">Sin tarjeta de crédito</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black py-24 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 border-b border-white/5 pb-16 mb-16">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="CitaLiks - Asistente de Voz con Inteligencia Artificial para Reservas" className="w-10 h-10 object-contain logo-neon" />
                            <span className="text-2xl font-black tracking-tighter text-white">CitaLiks</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                            <a href="#features" className="hover:text-primary transition-colors">Funciones</a>
                            <a href="#pricing" className="hover:text-primary transition-colors">Precios</a>
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

            <SalesChatWidget />
        </main>
    );
}

