"use client";
import { useState } from "react";
import Link from "next/link";

export default function Step5Calendar({
    data,
    onNext,
    onBack,
}: {
    data: any;
    onNext: (d: any) => void;
    onBack: () => void;
}) {
    const [isConnected, setIsConnected] = useState(!!data?.googleAccessToken);

    const handleConnect = () => {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token");
        window.location.href = `/api/google/connect${token ? `?token=${token}` : ""}`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-1">Conecta tu agenda</h2>
                <p className="text-white/50 text-sm">
                    El asistente leerá y escribirá en tu Google Calendar para gestionar las citas.
                </p>
            </div>

            <div className="space-y-6 py-4">
                <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10 border-dashed">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Cal" className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Google Calendar</h3>
                    <p className="text-xs text-white/40 text-center max-w-[280px] mb-6">
                        {isConnected
                            ? "Tu cuenta ya está vinculada correctamente."
                            : "Necesitamos acceso para ver tu disponibilidad y crear eventos."}
                    </p>

                    {isConnected ? (
                        <div className="px-8 py-3 rounded-xl bg-green-500/20 text-green-400 font-bold border border-green-500/30 flex items-center gap-2">
                            <span>✓</span> ¡Cuenta conectada!
                        </div>
                    ) : (
                        <button
                            onClick={handleConnect}
                            className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all flex items-center gap-2"
                        >
                            Conectar ahora
                        </button>
                    )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <span className="text-xl">💡</span>
                    <p className="text-[11px] text-yellow-200/70 leading-relaxed">
                        Tras conectar tu cuenta, Google te pedirá permisos. Una vez aceptados, volverás automáticamente aquí para finalizar.
                    </p>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-medium transition-all text-sm"
                >
                    ← Atrás
                </button>
                <button
                    onClick={() => onNext({})}
                    disabled={!isConnected} // In real app, we verify session or tokens
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${isConnected
                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                        : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                        }`}
                >
                    Ya lo he conectado →
                </button>
            </div>

            {/* Simulation helper: manually enable continue if the user just wants to see progress */}
            <div className="text-center pt-2">
                <button
                    onClick={() => setIsConnected(true)}
                    className="text-[10px] text-white/20 hover:text-white/40 underline italic"
                >
                    Simular conexión (solo para desarrollo)
                </button>
            </div>
        </div>
    );
}
