"use client";
import { useState } from "react";
import type { OnboardingData } from "../page";

type Service = { name: string; durationMin: number; price?: number };

export default function Step2Services({
    data,
    onNext,
    onBack,
}: {
    data: Partial<OnboardingData>;
    onNext: (d: Partial<OnboardingData>) => void;
    onBack: () => void;
}) {
    const [services, setServices] = useState<Service[]>(data.services ?? []);
    const [form, setForm] = useState<Service>({ name: "", durationMin: 30 });
    const [error, setError] = useState("");

    const add = () => {
        if (!form.name.trim()) { setError("Escribe un nombre de servicio"); return; }
        setServices([...services, { ...form }]);
        setForm({ name: "", durationMin: 30 });
        setError("");
    };

    const remove = (i: number) => setServices(services.filter((_, idx) => idx !== i));

    const submit = () => {
        if (services.length === 0) { setError("Añade al menos un servicio"); return; }
        onNext({ services });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-1">¿Qué servicios ofreces?</h2>
                <p className="text-white/50 text-sm">Tu agente usará esta lista para informar y reservar citas.</p>
            </div>

            {/* Add service form */}
            <div className="glass rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3 md:col-span-1">
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Nombre del servicio"
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 focus:border-blue-500 focus:outline-none text-white placeholder-white/30 text-sm"
                        />
                    </div>
                    <div>
                        <select
                            value={form.durationMin}
                            onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-sm"
                        >
                            {[15, 30, 45, 60, 90, 120].map((m) => (
                                <option key={m} value={m} className="bg-gray-900">{m} min</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <input
                            type="number"
                            value={form.price ?? ""}
                            onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="Precio €"
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 focus:border-blue-500 focus:outline-none text-white placeholder-white/30 text-sm"
                        />
                    </div>
                </div>
                <button onClick={add} className="w-full py-2 rounded-xl border border-blue-500/40 text-blue-300 hover:bg-blue-500/20 text-sm transition-all">
                    + Añadir servicio
                </button>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {/* Service list */}
            {services.length > 0 && (
                <ul className="space-y-2">
                    {services.map((s, i) => (
                        <li key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                            <div>
                                <span className="font-medium">{s.name}</span>
                                <span className="text-white/40 text-sm ml-3">{s.durationMin} min</span>
                                {s.price && <span className="text-white/40 text-sm ml-2">{s.price}€</span>}
                            </div>
                            <button onClick={() => remove(i)} className="text-red-400/60 hover:text-red-400 text-sm transition-colors">✕</button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex gap-3">
                <button onClick={onBack} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-medium transition-all text-sm">← Atrás</button>
                <button onClick={submit} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-all">
                    Continuar →
                </button>
            </div>
        </div>
    );
}
