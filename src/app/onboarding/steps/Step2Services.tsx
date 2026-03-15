"use client";
import { useState, useEffect } from "react";
import type { OnboardingData } from "../page";
import { getTemplateBySector } from "@/lib/sector-templates";
import { Check, Plus, Trash2 } from "lucide-react";

type Service = { name: string; durationMin: number; price?: number; isActive?: boolean };

export default function Step2Services({
    data,
    onNext,
    onBack,
}: {
    data: Partial<OnboardingData>;
    onNext: (d: Partial<OnboardingData>) => void;
    onBack: (d?: Partial<OnboardingData>) => void;
}) {
    const [services, setServices] = useState<Service[]>([]);
    const [form, setForm] = useState<Service>({ name: "", durationMin: 30, isActive: true });
    const [error, setError] = useState("");

    // Cargar plantilla si no hay servicios guardados y hay un sector seleccionado
    useEffect(() => {
        if (data.services && data.services.length > 0) {
            setServices(data.services.map(s => ({ ...s, isActive: true })));
        } else if (data.businessType) {
            const template = getTemplateBySector(data.businessType);
            if (template) {
                setServices(template.services.map(s => ({
                    name: s.name,
                    durationMin: s.durationMin,
                    price: s.price,
                    isActive: s.defaultActive
                })));
            }
        }
    }, [data.businessType, data.services]);

    const add = () => {
        if (!form.name.trim()) { setError("Escribe un nombre de servicio"); return; }
        setServices([...services, { ...form }]);
        setForm({ name: "", durationMin: 30, isActive: true });
        setError("");
    };

    const remove = (i: number) => setServices(services.filter((_, idx) => idx !== i));

    const toggleService = (i: number) => {
        const newServices = [...services];
        newServices[i].isActive = !newServices[i].isActive;
        setServices(newServices);
        setError("");
    };

    const submit = () => {
        const activeServices = services.filter(s => s.isActive);
        if (activeServices.length === 0) { setError("Selecciona al menos un servicio"); return; }
        
        // Limpiamos el isActive temporal antes de guardar
        const servicesToSave = activeServices.map(({ isActive, ...rest }) => rest);
        onNext({ services: servicesToSave });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-1">Elige tus servicios</h2>
                <p className="text-white/50 text-sm">
                    Hemos cargado los servicios más comunes para {data.businessType || 'tu sector'}. Selecciona los que quieras ofrecer.
                </p>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded-xl border border-red-500/20">{error}</p>}

            {/* Checklist de servicios */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {services.map((s, i) => (
                    <div 
                        key={i} 
                        onClick={() => toggleService(i)}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                            s.isActive 
                                ? 'bg-blue-600/20 border-blue-500/50 shadow-inner' 
                                : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                                s.isActive ? 'bg-blue-500 border-blue-400 text-white' : 'border-white/20 bg-black/20'
                            }`}>
                                {s.isActive && <Check size={14} strokeWidth={3} />}
                            </div>
                            <div>
                                <h3 className={`font-medium ${s.isActive ? 'text-blue-100' : 'text-white/70'}`}>{s.name}</h3>
                                <div className="flex items-center gap-3 mt-1 text-xs text-white/40 font-mono">
                                    <span>⏱ {s.durationMin} min</span>
                                    {s.price && <span>💰 {s.price}€</span>}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); remove(i); }} 
                            className="p-2 rounded-lg text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add custom service form */}
            <div className="glass rounded-2xl p-4 space-y-3 mt-4">
                <h4 className="text-sm font-medium text-white/70">¿Falta alguno? Añádelo manualmente</h4>
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-5">
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Nombre del servicio"
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 focus:border-blue-500 focus:outline-none text-white placeholder-white/30 text-sm"
                        />
                    </div>
                    <div className="col-span-6 md:col-span-4">
                        <select
                            value={form.durationMin}
                            onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-sm"
                        >
                            {[15, 30, 45, 60, 90, 120, 240].map((m) => (
                                <option key={m} value={m} className="bg-gray-900">{m} min</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-6 md:col-span-3">
                        <input
                            type="number"
                            value={form.price ?? ""}
                            onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="Precio €"
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 focus:border-blue-500 focus:outline-none text-white placeholder-white/30 text-sm"
                        />
                    </div>
                </div>
                <button onClick={add} className="w-full py-2 rounded-xl border border-white/10 text-white/70 hover:bg-white/10 hover:text-white text-sm transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> Añadir servicio personalizado
                </button>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
                <button onClick={() => onBack({ services: services.filter(s => s.isActive).map(({isActive, ...rest}) => rest) })} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-medium transition-all text-sm">← Atrás</button>
                <button onClick={submit} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-all shadow-lg shadow-blue-500/20">
                    Continuar →
                </button>
            </div>
        </div>
    );
}
