"use client";
import { useForm } from "react-hook-form";
import type { OnboardingData } from "../page";

export default function Step4Agent({
    data,
    onNext,
    onBack,
}: {
    data: Partial<OnboardingData>;
    onNext: (d: Partial<OnboardingData>) => void;
    onBack: (d?: Partial<OnboardingData>) => void;
}) {
    const { register, handleSubmit, watch } = useForm({
        defaultValues: {
            agentName: data.agentName || "Asistente",
            agentTone: data.agentTone || "profesional",
            agentVoice: data.agentVoice || "male",
            transferPhone: data.transferPhone || "",
        },
    });

    const selectedTone = watch("agentTone");
    const selectedVoice = watch("agentVoice");
    const agentName = watch("agentName");

    return (
        <form onSubmit={handleSubmit(onNext)} className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-1">Personaliza tu asistente</h2>
                <p className="text-white/50 text-sm">Configura cómo se comportará la IA al teléfono.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Nombre del asistente</label>
                    <input
                        {...register("agentName")}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-white placeholder-white/30 transition-all"
                        placeholder="Ej: Lucía"
                    />
                    <p className="text-white/30 text-[10px] mt-1 italic">Este nombre se usará en el saludo inicial.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Género de la voz</label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={`relative flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${selectedVoice === "male"
                            ? "bg-violet-500/10 border-violet-500"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}>
                            <input
                                {...register("agentVoice")}
                                type="radio"
                                value="male"
                                className="hidden"
                            />
                            <div className="text-center">
                                <span className="block font-semibold">Hombre</span>
                                <span className="text-[10px] text-white/40 italic">Voz masculina</span>
                            </div>
                        </label>
                        <label className={`relative flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${selectedVoice === "female"
                            ? "bg-violet-500/10 border-violet-500"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}>
                            <input
                                {...register("agentVoice")}
                                type="radio"
                                value="female"
                                className="hidden"
                            />
                            <div className="text-center">
                                <span className="block font-semibold">Mujer</span>
                                <span className="text-[10px] text-white/40 italic">Voz femenina</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Tono de voz</label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={`relative flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${selectedTone === "profesional"
                            ? "bg-violet-500/10 border-violet-500"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}>
                            <input
                                {...register("agentTone")}
                                type="radio"
                                value="profesional"
                                className="hidden"
                            />
                            <div className="text-center">
                                <span className="block font-semibold">Profesional</span>
                                <span className="text-[10px] text-white/40 italic">Usted, formal</span>
                            </div>
                        </label>
                        <label className={`relative flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${selectedTone === "cercano"
                            ? "bg-violet-500/10 border-violet-500"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}>
                            <input
                                {...register("agentTone")}
                                type="radio"
                                value="cercano"
                                className="hidden"
                            />
                            <div className="text-center">
                                <span className="block font-semibold">Cercano</span>
                                <span className="text-[10px] text-white/40 italic">Tú, amigable</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Teléfono de desvío (Humano)</label>
                    <input
                        {...register("transferPhone")}
                        type="tel"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-white placeholder-white/30 transition-all font-mono"
                        placeholder="Ej: +34 600 000 000"
                    />
                    <p className="text-white/30 text-[10px] mt-1 italic">Si la IA no puede resolver algo, transferirá la llamada a este número.</p>
                </div>

                <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                    <p className="text-xs text-violet-200/70 leading-relaxed italic">
                        "Hola, soy {agentName || "Lucía"}, asistente de {data.businessName || "tu negocio"}. ¿En qué puedo ayudarte hoy?"
                    </p>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => onBack(watch())}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-medium transition-all text-sm"
                >
                    ← Atrás
                </button>
                <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/25"
                >
                    Continuar →
                </button>
            </div>
        </form>
    );
}
