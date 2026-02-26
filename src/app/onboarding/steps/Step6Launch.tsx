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

    const launch = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/agents/provision", { method: "POST" });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.details || json.error || "Error al crear el agente");
            }

            onFinish();
        } catch (err: any) {
            setError(err.message || "Hubo un problema al crear tu asistente. Inténtalo de nuevo.");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 py-4 text-center">
            <div className="w-24 h-24 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                <span className="text-4xl animate-float">🚀</span>
            </div>

            <div className="space-y-2">
                <h2 className="text-3xl font-bold">¡Todo listo para brillar!</h2>
                <p className="text-white/50">
                    Ya tenemos la configuración de <span className="text-white font-medium">{data.businessName}</span>.
                    Al pulsar "Lanzar", crearemos tu agente de IA y asignaremos tu número telefónico.
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
