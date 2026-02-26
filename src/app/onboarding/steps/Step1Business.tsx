"use client";
import { useForm } from "react-hook-form";
import type { OnboardingData } from "../page";

const BUSINESS_TYPES = [
    "Peluquería / Barbería",
    "Centro de estética / Spa",
    "Clínica / Médico",
    "Dentista",
    "Fisioterapia",
    "Restaurante / Cafetería",
    "Taller de coches",
    "Asesoría / Gestoría",
    "Otro",
];

export default function Step1Business({
    data,
    onNext,
}: {
    data: Partial<OnboardingData>;
    onNext: (d: Partial<OnboardingData>) => void;
}) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            businessName: data.businessName ?? "",
            businessType: data.businessType ?? "",
            city: data.city ?? "",
        },
    });

    return (
        <form onSubmit={handleSubmit(onNext)} className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-1">Cuéntanos sobre tu negocio</h2>
                <p className="text-white/50 text-sm">Tu asistente se presentará con el nombre de tu negocio.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Nombre del negocio *</label>
                    <input
                        {...register("businessName", { required: "Campo obligatorio" })}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-white/30 transition-all"
                        placeholder="Ej: Peluquería Ana García"
                    />
                    {errors.businessName && <p className="text-red-400 text-xs mt-1">{errors.businessName.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Tipo de negocio *</label>
                    <select
                        {...register("businessType", { required: "Selecciona un tipo" })}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-blue-500 focus:outline-none text-white transition-all"
                    >
                        <option value="" className="bg-gray-900">Selecciona...</option>
                        {BUSINESS_TYPES.map((t) => (
                            <option key={t} value={t} className="bg-gray-900">{t}</option>
                        ))}
                    </select>
                    {errors.businessType && <p className="text-red-400 text-xs mt-1">{errors.businessType.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Ciudad *</label>
                    <input
                        {...register("city", { required: "Campo obligatorio" })}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-white/30 transition-all"
                        placeholder="Ej: Madrid"
                    />
                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>}
                </div>
            </div>

            <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25"
            >
                Continuar →
            </button>
        </form>
    );
}
