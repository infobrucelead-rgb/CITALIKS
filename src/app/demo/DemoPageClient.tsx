"use client";

import React from "react";
import Link from "next/link";
import SalesChatWidget from "@/components/SalesChatWidget";
import { Calendar, MessageSquare, PhoneForwarded, LayoutDashboard } from "lucide-react";

type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";

export default function DemoPageClient() {
    const [callStatus, setCallStatus] = React.useState<CallStatus>("idle");
    const [errorMsg, setErrorMsg] = React.useState("");
    const [retellClient, setRetellClient] = React.useState<any>(null);
    const [callDuration, setCallDuration] = React.useState(0);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Load Retell Web SDK dynamically (client-side only)
    React.useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startCall = async () => {
        if (callStatus === "connecting" || callStatus === "active") return;
        setCallStatus("connecting");
        setErrorMsg("");

        try {
            // Get access token from our API
            const res = await fetch("/api/demo/start-call", { 
                method: "POST",
                body: JSON.stringify({ agentType: "carolina" })
            });
            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || "Error al iniciar la demo");
                setCallStatus("error");
                return;
            }

            // Dynamically import Retell Web SDK
            const { RetellWebClient } = await import("retell-client-js-sdk");
            const client = new RetellWebClient();

            client.on("call_started", () => {
                setCallStatus("active");
                setCallDuration(0);
                timerRef.current = setInterval(() => {
                    setCallDuration(d => d + 1);
                }, 1000);
            });

            client.on("call_ended", () => {
                setCallStatus("ended");
                if (timerRef.current) clearInterval(timerRef.current);
            });

            client.on("error", (err: any) => {
                console.error("Retell error:", err);
                setErrorMsg("Error en la llamada. Inténtalo de nuevo.");
                setCallStatus("error");
                if (timerRef.current) clearInterval(timerRef.current);
            });

            await client.startCall({
                accessToken: data.access_token,
                sampleRate: 24000,
                captureDeviceId: "default",
                emitRawAudioSamples: false,
            });

            setRetellClient(client);
        } catch (err: any) {
            console.error("Error starting demo call:", err);
            setErrorMsg(err.message || "No se pudo iniciar la llamada");
            setCallStatus("error");
        }
    };

    const endCall = () => {
        if (retellClient) {
            retellClient.stopCall();
        }
        setCallStatus("ended");
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const formatDuration = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <main className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
            {/* Nav */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-6xl">
                <div className="glass-nav px-8 py-4 rounded-full flex items-center justify-between shadow-sm">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img src="/logo.png" alt="CitaLiks Logo" className="w-10 h-10 object-contain logo-neon" />
                        <span className="text-2xl font-black tracking-tighter text-primary font-logo">CitaLiks</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="https://calendly.com/citaliks/30min" target="_blank" className="bg-primary text-black px-6 py-2 rounded-full text-sm font-black glow-hover transition-all">
                            Probar Gratis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Demo en vivo — Sin registro
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                    Habla con <span className="text-primary">Carolina</span>
                </h1>
                <p className="text-white/50 text-lg max-w-xl mx-auto">
                    Carolina es la asistente de demostración de CitaLiks. Está simulando ser la recepción de una clínica. Prueba a reservar una cita.
                </p>
            </section>

            {/* Call widget */}
            <section className="max-w-md mx-auto px-6 py-8">
                <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 text-center">

                    {/* Avatar */}
                    <div className="relative inline-flex mb-8">
                        <div className={`w-32 h-32 rounded-[2.5rem] bg-surface-container border border-white/10 flex items-center justify-center text-5xl shadow-2xl shadow-primary/10 transition-all logo-neon ${callStatus === "active" ? "scale-110 rotate-3" : ""}`}>
                            <img src="/logo.png" alt="CitaLiks - Carolina, el futuro de la atención al cliente por voz" className="w-20 h-20 object-contain" />
                        </div>
                        {callStatus === "active" && (
                            <span className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-[#0a0a0f] flex items-center justify-center">
                                <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                            </span>
                        )}
                        {callStatus === "connecting" && (
                            <span className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                        )}
                    </div>

                    <h2 className="text-xl font-black mb-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Carolina</h2>
                    <p className="text-white/40 text-sm mb-6" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}>Asistente de CitaLiks · Demo</p>

                    {/* Status */}
                    {callStatus === "idle" && (
                        <p className="text-white/30 text-sm mb-6">Pulsa el botón para iniciar la llamada de demo</p>
                    )}
                    {callStatus === "connecting" && (
                        <p className="text-primary text-sm mb-6 animate-pulse font-black uppercase tracking-widest">Conectando con Carolina...</p>
                    )}
                    {callStatus === "active" && (
                        <div className="mb-6">
                            <p className="text-green-400 text-sm font-bold">En llamada · {formatDuration(callDuration)}</p>
                            <div className="flex items-center justify-center gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-1 bg-green-400 rounded-full animate-bounce`}
                                        style={{ height: `${8 + Math.random() * 16}px`, animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                        </div>
                    )}
                    {callStatus === "ended" && (
                        <div className="mb-6">
                            <p className="text-white/50 text-sm">Llamada finalizada · {formatDuration(callDuration)}</p>
                            <p className="text-primary text-sm mt-1 font-bold uppercase tracking-widest">¿Qué te ha parecido?</p>
                        </div>
                    )}
                    {callStatus === "error" && (
                        <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
                    )}

                    {/* CTA Button */}
                    {(callStatus === "idle" || callStatus === "error") && (
                        <button
                            onClick={startCall}
                            className="w-full py-4 rounded-2xl bg-primary text-black hover:bg-green-400 font-bold text-lg transition-all hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <span className="text-2xl">📞</span>
                            Llamar a Carolina
                        </button>
                    )}
                    {callStatus === "connecting" && (
                        <button disabled className="w-full py-4 rounded-2xl bg-primary/20 text-primary border border-primary/30 font-black text-lg cursor-not-allowed flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Conectando...
                        </button>
                    )}
                    {callStatus === "active" && (
                        <button
                            onClick={endCall}
                            className="w-full py-4 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white font-bold text-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            <span className="text-2xl">📵</span>
                            Colgar
                        </button>
                    )}
                    {callStatus === "ended" && (
                        <div className="space-y-3">
                            <button
                                onClick={() => { setCallStatus("idle"); setCallDuration(0); }}
                                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all border border-white/10"
                            >
                                Llamar de nuevo
                            </button>
                            <Link href="https://calendly.com/citaliks/30min" target="_blank"
                                className="w-full py-3 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 glow-hover"
                            >
                                Quiero esto para mi negocio →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Tips */}
                {callStatus === "idle" && (
                    <div className="mt-6 space-y-2">
                        <p className="text-white/30 text-xs text-center mb-3">Prueba a decirle...</p>
                        {[
                            "\"Quiero reservar una manicura para mañana\"",
                            "\"¿Qué servicios tenéis disponibles?\"",
                            "\"¿A qué hora abrís los sábados?\"",
                        ].map(tip => (
                            <div key={tip} className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-white/40 text-xs text-center">
                                {tip}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Features below */}
            <section className="max-w-4xl mx-auto px-6 py-12">
                <p className="text-center text-white/30 text-sm mb-12 uppercase tracking-[0.2em] font-black">Lo que incluye tu asistente personalizado</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { icon: <Calendar size={32} />, label: "Google Calendar" },
                        { icon: <MessageSquare size={32} />, label: "SMS automáticos" },
                        { icon: <PhoneForwarded size={32} />, label: "Desvío a humano" },
                        { icon: <LayoutDashboard size={32} />, label: "Dashboard completo" },
                    ].map(f => (
                        <div key={f.label} className="group rounded-[2rem] bg-white/[0.02] border border-white/5 p-8 text-center relief-premium hover:scale-105 transition-all duration-300">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-6 logo-neon group-hover:scale-110 transition-transform">
                                {f.icon}
                            </div>
                            <span className="text-primary text-[10px] font-black uppercase tracking-widest">{f.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="max-w-2xl mx-auto px-6 pb-20 text-center">
                <div className="rounded-[3rem] bg-surface-container border border-white/10 p-12 relief-premium">
                    <h2 className="text-3xl font-black mb-3 text-white uppercase italic tracking-tighter">¿Listo para tener tu propio asistente?</h2>
                    <p className="text-white/50 text-sm mb-10 max-w-md mx-auto">Configuración asistida en 5 minutos. Tu asistente personalizado con el nombre de tu negocio.</p>
                    <Link href="https://calendly.com/citaliks/30min" target="_blank"
                        className="inline-block px-12 py-5 rounded-2xl bg-primary text-black font-black text-xl transition-all glow-hover uppercase tracking-widest active:scale-95"
                    >
                        Empezar ahora →
                    </Link>
                </div>
            </section>
            
            <SalesChatWidget />
        </main>
    );
}
