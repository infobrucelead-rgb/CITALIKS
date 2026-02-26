"use client";
import { useState } from "react";
import type { OnboardingData } from "../page";

export default function Step6Launch({
    data,
    onFinish,
}: {
    data: Partial<OnboardingData>;
    onFinish: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [launched, setLaunched] = useState(false);
    const [assignedPhone, setAssignedPhone] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const launch = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/agents/provision", { method: "POST" });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.details || json.error || "Error al crear el agente");
            }

            setAssignedPhone(json.phone || null);
            setLaunched(true);
            onFinish();
        } catch (err: any) {
            setError(err.message || "Hubo un problema al crear tu asistente. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const copyPhone = () => {
        if (assignedPhone) {
            navigator.clipboard.writeText(assignedPhone);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // ── Post-launch: instrucciones de desvío ──────────────────────────────────
    if (launched && assignedPhone) {
        return (
            <div className="space-y-6 py-2">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                        <span className="text-3xl">✅</span>
                    </div>
                    <h2 className="text-2xl font-bold">¡Tu asistente está listo!</h2>
                    <p className="text-white/50 text-sm">
                        Hemos creado tu número exclusivo. Solo necesitas configurar el desvío en tu operadora.
                    </p>
                </div>

                {/* Número asignado */}
                <div className="glass rounded-2xl p-5 border border-violet-500/30 bg-violet-500/5">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Tu número CitaLiks</p>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-2xl font-mono font-bold text-violet-300">{assignedPhone}</span>
                        <button
                            onClick={copyPhone}
                            className="px-3 py-1.5 rounded-lg bg-violet-600/40 hover:bg-violet-600/70 text-xs font-medium transition-all"
                        >
                            {copied ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>
                    <p className="text-xs text-white/30 mt-2">
                        Este es el número al que debes desviar las llamadas de tu número actual.
                    </p>
                </div>

                {/* Instrucciones de desvío */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">
                        Cómo configurar el desvío en tu operadora
                    </h3>

                    <div className="space-y-2">
                        {[
                            {
                                step: "1",
                                title: "Llama a tu operadora o entra en su web",
                                desc: "Contacta con el servicio de atención al cliente de tu operadora actual (Movistar, Vodafone, Orange, etc.) o accede a tu área de cliente online.",
                            },
                            {
                                step: "2",
                                title: "Solicita activar el desvío de llamadas",
                                desc: `Pide que todas las llamadas entrantes de tu número se desvíen al número ${assignedPhone}. Puedes pedirlo como "desvío incondicional" para que el bot atienda siempre.`,
                            },
                            {
                                step: "3",
                                title: "Alternativa: desvío cuando no contestas",
                                desc: "Si prefieres atender tú primero y que el bot solo actúe cuando no puedas coger la llamada, pide el "desvío por no respuesta" al mismo número.",
                            },
                            {
                                step: "4",
                                title: "¡Listo! Haz una llamada de prueba",
                                desc: `Llama a tu número de siempre desde otro teléfono. Deberías escuchar a tu asistente ${data.agentName || "IA"} responder automáticamente.`,
                            },
                        ].map(({ step, title, desc }) => (
                            <div key={step} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-7 h-7 rounded-full bg-violet-600/50 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                    {step}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{title}</p>
                                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nota sobre teléfono de desvío a humano */}
                {data.transferPhone && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/70 leading-relaxed">
                        <span className="font-semibold">Recuerda:</span> Si el cliente pide hablar con una persona, el bot transferirá la llamada automáticamente a{" "}
                        <span className="font-mono font-semibold">{data.transferPhone}</span>.
                    </div>
                )}

                <button
                    onClick={() => window.location.href = "/dashboard"}
                    className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition-all text-sm"
                >
                    Ir al Dashboard →
                </button>
            </div>
        );
    }

    // ── Pre-launch: resumen y botón de lanzar ────────────────────────────────
    return (
        <div className="space-y-8 py-4 text-center">
            <div className="w-24 h-24 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                <span className="text-4xl animate-float">🚀</span>
            </div>

            <div className="space-y-2">
                <h2 className="text-3xl font-bold">¡Todo listo para brillar!</h2>
                <p className="text-white/50">
                    Ya tenemos la configuración de <span className="text-white font-medium">{data.businessName}</span>.
                    Al pulsar "Lanzar", crearemos tu agente de IA y te asignaremos un número telefónico exclusivo.
                </p>
            </div>

            <div className="glass rounded-2xl p-6 text-left space-y-4 max-w-sm mx-auto">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-white/40">Asistente:</span>
                    <span>{data.agentName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-white/40">Servicios:</span>
                    <span>{data.services?.length} configurados</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-white/40">Agenda:</span>
                    <span className="text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Conectada
                    </span>
                </div>
                {data.transferPhone && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/40">Desvío a humano:</span>
                        <span className="font-mono text-xs">{data.transferPhone}</span>
                    </div>
                )}
            </div>

            {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}

            <button
                onClick={launch}
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${loading
                    ? "bg-white/10 text-white/50 animate-pulse cursor-wait"
                    : "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/30 glow-purple"
                    }`}
            >
                {loading ? "Creando tu asistente..." : "Lanzar CitaLiks 🚀"}
            </button>

            <p className="text-white/30 text-xs">Aceptas los términos y condiciones del servicio al continuar.</p>
        </div>
    );
}
