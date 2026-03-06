"use client";
import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function InstructionsContent() {
    const searchParams = useSearchParams();
    const assignedPhone = searchParams.get("phone") || "TU_NÚMERO_AQUÍ";
    const agentName = searchParams.get("agent") || "Asistente IA";
    const transferPhone = searchParams.get("transfer") || "";
    const [copied, setCopied] = useState(false);

    const copyPhone = () => {
        navigator.clipboard.writeText(assignedPhone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-12 font-sans flex justify-center">
            <div className="max-w-xl w-full space-y-8">
                <div className="text-center space-y-4 pt-10">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <span className="text-4xl">✅</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">¡Tu asistente está listo!</h1>
                    <p className="text-white/50 text-base max-w-sm mx-auto">
                        Manten esta pestaña abierta con los datos de tu configuración.
                    </p>
                </div>

                {/* Número asignado */}
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-violet-500/30 shadow-[0_0_40px_rgba(139,92,246,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
                    <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-2">Tu Número de Asistente</p>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-3xl md:text-4xl font-mono font-bold text-violet-300 tracking-tight">{assignedPhone}</span>
                        <button
                            onClick={copyPhone}
                            className="px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-bold border border-violet-500/30 transition-all uppercase tracking-wider"
                        >
                            {copied ? "¡COPIADO!" : "COPIAR"}
                        </button>
                    </div>
                    <p className="text-sm text-white/40 mt-3 font-medium">
                        Este es el número al que debes <span className="text-white">desviar las llamadas</span> de tu número físico principal.
                    </p>
                </div>

                {/* Instrucciones de desvío */}
                <div className="space-y-4 bg-white/[0.02] p-6 md:p-8 rounded-3xl border border-white/5">
                    <h3 className="text-sm font-black text-white/70 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Cómo configurar el desvío
                    </h3>

                    <div className="space-y-3">
                        {[
                            {
                                step: "1",
                                title: "Llama a tu operadora o entra en su web",
                                desc: "Contacta con el servicio de atención de tu operadora actual (Movistar, Vodafone, Orange, etc.) o entra en tu área de cliente online.",
                            },
                            {
                                step: "2",
                                title: "Solicita activar el desvío de llamadas",
                                desc: `Pide que todas las llamadas entrantes de tu negocio se desvíen al número ${assignedPhone}. Puedes pedirlo como "desvío incondicional".`,
                            },
                            {
                                step: "3",
                                title: "Alternativa: desvío cuando no contestas",
                                desc: "Si prefieres coger tú el teléfono primero y que el bot actúe de recepcionista cuando estás ocupado, pide el 'desvío por no respuesta', 'comunicando' o 'apagado'.",
                            },
                            {
                                step: "4",
                                title: "Haz una llamada de prueba",
                                desc: `Llama a tu número comercial desde otro teléfono. Deberías escuchar a tu asistente (${agentName}) responder de inmediato.`,
                            },
                        ].map(({ step, title, desc }) => (
                            <div key={step} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm font-black shrink-0 border border-blue-500/20">
                                    {step}
                                </div>
                                <div className="pt-1">
                                    <p className="text-sm font-bold text-white/90 leading-none">{title}</p>
                                    <p className="text-xs text-white/40 mt-2 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {transferPhone && (
                    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-500/80 leading-relaxed font-medium flex gap-4 items-start">
                        <div className="shrink-0 text-xl">⚠️</div>
                        <p>
                            <span className="block text-amber-500 font-bold mb-1 uppercase text-xs tracking-wider">Desvío a Humano configurado</span>
                            Si un cliente pide hablar con una persona, o hay una emergencia, el bot le dirá que espere y transferirá la llamada automáticamente a <span className="font-mono bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/30">{transferPhone}</span>.
                        </p>
                    </div>
                )}

                <div className="pt-4 text-center">
                    <button
                        onClick={() => window.print()}
                        className="text-white/30 hover:text-white/60 text-xs font-bold uppercase tracking-widest border-b border-white/10 hover:border-white/30 pb-0.5 transition-all"
                    >
                        Imprimir / Guardar Instucciones PDF
                    </button>
                    <p className="mt-8 text-[10px] text-white/20 uppercase font-bold tracking-widest">
                        Ya puedes volver a la pestaña central de tu Dashboard CitaLiks.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function InstruccionesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white/30 text-sm font-bold uppercase tracking-widest">Cargando...</div>}>
            <InstructionsContent />
        </Suspense>
    );
}