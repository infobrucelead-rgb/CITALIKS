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
            <div className="space-y-6 py-6 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <span className="text-4xl">✅</span>
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight">¡Tu asistente está listo!</h2>
                    <p className="text-white/50 text-[15px] max-w-sm mx-auto leading-relaxed">
                        Hemos creado tu agente en la nube y asignado tu número de teléfono exclusivo.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white/70 max-w-sm mx-auto">
                    Para que el bot responda por ti, tienes que <strong>desviar tus llamadas</strong> hacia el nuevo número que te hemos asignado.
                </div>

                <div className="max-w-sm mx-auto space-y-4 pt-4">
                    <button
                        onClick={() => {
                            const qs = new URLSearchParams({
                                phone: assignedPhone || "",
                                agent: data.agentName || "",
                                transfer: data.transferPhone || ""
                            }).toString();
                            window.open(`/instrucciones?${qs}`, "_blank");
                            setTimeout(() => {
                                window.location.href = "/dashboard";
                            }, 500);
                        }}
                        className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 font-black transition-all text-base shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] uppercase tracking-wider"
                    >
                        Abrir Instrucciones y Finalizar ✨
                    </button>
                    <p className="text-xs text-violet-400 font-bold px-4">
                        💡 IMPORTANTE: Las instrucciones se abrirán en una nueva pestaña para que puedas leerlas tranquilamente mientras exploras tu panel.
                    </p>
                </div>
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
                    <span className={data.googleAccessToken ? "text-green-400 flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
                        <span className={`w-1.5 h-1.5 rounded-full ${data.googleAccessToken ? "bg-green-400" : "bg-amber-400"}`} /> 
                        {data.googleAccessToken ? "Conectada" : "En espera / Maestra"}
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
