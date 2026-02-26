"use client";

import React from "react";
import Link from "next/link";

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
        setCallStatus("connecting");
        setErrorMsg("");

        try {
            // Get access token from our API
            const res = await fetch("/api/demo/start-call", { method: "POST" });
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
            <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-sm font-bold">C</div>
                    <span className="text-xl font-bold">Cita<span className="text-violet-400">Liks</span></span>
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-white/40 text-sm hidden sm:block">¿Te ha convencido?</span>
                    <Link href="/sign-up" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-all">
                        Contratar →
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-sm text-violet-300 mb-6">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Demo en vivo — Sin registro
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                    Habla con <span className="text-violet-400">Sofía</span>
                </h1>
                <p className="text-white/50 text-lg max-w-xl mx-auto">
                    Sofía es la asistente de demostración de CitaLiks. Está simulando ser la recepción de una clínica. Prueba a reservar una cita.
                </p>
            </section>

            {/* Call widget */}
            <section className="max-w-md mx-auto px-6 py-8">
                <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 text-center">

                    {/* Avatar */}
                    <div className="relative inline-flex mb-6">
                        <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-5xl shadow-2xl shadow-violet-500/30 transition-all ${callStatus === "active" ? "scale-110" : ""}`}>
                            🤖
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

                    <h2 className="text-xl font-black mb-1">Sofía</h2>
                    <p className="text-white/40 text-sm mb-6">Asistente de CitaLiks · Demo</p>

                    {/* Status */}
                    {callStatus === "idle" && (
                        <p className="text-white/30 text-sm mb-6">Pulsa el botón para iniciar la llamada de demo</p>
                    )}
                    {callStatus === "connecting" && (
                        <p className="text-violet-300 text-sm mb-6 animate-pulse">Conectando con Sofía...</p>
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
                            <p className="text-violet-300 text-sm mt-1">¿Qué te ha parecido?</p>
                        </div>
                    )}
                    {callStatus === "error" && (
                        <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
                    )}

                    {/* CTA Button */}
                    {(callStatus === "idle" || callStatus === "error") && (
                        <button
                            onClick={startCall}
                            className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 font-bold text-lg transition-all hover:shadow-xl hover:shadow-violet-500/30 flex items-center justify-center gap-3"
                        >
                            <span className="text-2xl">📞</span>
                            Llamar a Sofía
                        </button>
                    )}
                    {callStatus === "connecting" && (
                        <button disabled className="w-full py-4 rounded-2xl bg-violet-600/50 font-bold text-lg cursor-not-allowed flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Conectando...
                        </button>
                    )}
                    {callStatus === "active" && (
                        <button
                            onClick={endCall}
                            className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 font-bold text-lg transition-all flex items-center justify-center gap-3"
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
                            <Link href="/sign-up"
                                className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 font-bold transition-all flex items-center justify-center gap-2"
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
                <p className="text-center text-white/30 text-sm mb-8">Lo que incluye tu asistente personalizado</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: "📅", label: "Google Calendar" },
                        { icon: "📱", label: "SMS automáticos" },
                        { icon: "🔀", label: "Desvío a humano" },
                        { icon: "📊", label: "Dashboard completo" },
                    ].map(f => (
                        <div key={f.label} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-center">
                            <span className="text-2xl block mb-2">{f.icon}</span>
                            <span className="text-white/50 text-xs font-medium">{f.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="max-w-2xl mx-auto px-6 pb-20 text-center">
                <div className="rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/20 p-10">
                    <h2 className="text-2xl font-black mb-3">¿Listo para tener tu propio asistente?</h2>
                    <p className="text-white/50 text-sm mb-6">Configuración en 5 minutos. Tu asistente personalizado con el nombre de tu negocio.</p>
                    <Link href="/sign-up"
                        className="inline-block px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 font-bold text-lg transition-all hover:shadow-xl hover:shadow-violet-500/30"
                    >
                        Empezar ahora →
                    </Link>
                </div>
            </section>
        </main>
    );
}
