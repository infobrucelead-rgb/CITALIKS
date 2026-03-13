"use client";
import React, { useState } from "react";
import { Calendar, Mail, Zap, Database, CheckCircle2, Utensils } from "lucide-react";

export default function Step5Calendar({
    data,
    onNext,
    onBack,
}: {
    data: any;
    onNext: (d: any) => void;
    onBack: () => void;
}) {
    const [preferences, setPreferences] = useState({
        wantsGoogleCalendar: data?.wantsGoogleCalendar ?? true,
        wantsMicrosoftOutlook: data?.wantsMicrosoftOutlook ?? false,
        wantsCRM: data?.wantsCRM ?? false,
        wantsPMS: data?.wantsPMS ?? false,
        wantsRestaurant: data?.wantsRestaurant ?? false,
    });

    const togglePref = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleNext = () => {
        onNext(preferences);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-1">Integraciones</h2>
                <p className="text-white/50 text-sm">
                    Indícanos qué sistemas utilizas. Nuestro equipo de soporte terminará de configurarlos por ti para que no tengas que preocuparte de la parte técnica.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <SelectionCard
                    icon={<Calendar className="text-blue-400" size={20} />}
                    title="Google Calendar"
                    active={preferences.wantsGoogleCalendar}
                    onClick={() => togglePref("wantsGoogleCalendar")}
                />
                <SelectionCard
                    icon={<Mail className="text-sky-400" size={20} />}
                    title="Microsoft Outlook"
                    active={preferences.wantsMicrosoftOutlook}
                    onClick={() => togglePref("wantsMicrosoftOutlook")}
                />
                <SelectionCard
                    icon={<Zap className="text-amber-400" size={20} />}
                    title="CRM (HubSpot, etc)"
                    active={preferences.wantsCRM}
                    onClick={() => togglePref("wantsCRM")}
                />
                <SelectionCard
                    icon={<Database className="text-emerald-400" size={20} />}
                    title="PMS / Software Gestión"
                    active={preferences.wantsPMS}
                    onClick={() => togglePref("wantsPMS")}
                />
                <SelectionCard
                    icon={<Utensils className="text-orange-400" size={20} />}
                    title="Motor Reservas (Restaurante)"
                    active={preferences.wantsRestaurant}
                    onClick={() => togglePref("wantsRestaurant")}
                />
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] text-blue-400 font-bold">i</span>
                </div>
                <p className="text-[11px] text-blue-200/70 leading-relaxed">
                    Una vez finalices el registro, un técnico se pondrá en contacto contigo para sincronizar las cuentas de forma segura si es necesario.
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-medium transition-all text-sm"
                >
                    ← Atrás
                </button>
                <button
                    onClick={handleNext}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/20"
                >
                    Continuar →
                </button>
            </div>
        </div>
    );
}

function SelectionCard({ icon, title, active, onClick }: { icon: React.ReactNode, title: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${active ? "bg-blue-600/10 border-blue-600/30 ring-1 ring-blue-600/20" : "bg-white/[0.03] border-white/5 hover:border-white/10"
                }`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-blue-600 text-white" : "bg-white/5 text-white/40"}`}>
                {icon}
            </div>
            <div className="flex-1">
                <p className={`text-sm font-bold ${active ? "text-white" : "text-white/60"}`}>{title}</p>
                <p className="text-[10px] text-white/30">{active ? "Seleccionado" : "Click para conectar"}</p>
            </div>
            {active && <CheckCircle2 size={16} className="text-blue-500" />}
        </button>
    );
}
