"use client";
import { useState } from "react";
import type { OnboardingData } from "../page";

const DAYS = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
];

export default function Step3Schedule({
    data,
    onNext,
    onBack,
}: {
    data: Partial<OnboardingData>;
    onNext: (d: Partial<OnboardingData>) => void;
    onBack: () => void;
}) {
    const [schedules, setSchedules] = useState(
        data.schedules ||
        DAYS.map((_, i) => ({
            dayOfWeek: i,
            openTime: "09:00",
            closeTime: "20:00",
            isOpen: i < 5,
        }))
    );

    const toggleDay = (i: number) => {
        setSchedules(prev => prev.map((s, idx) =>
            idx === i ? { ...s, isOpen: !s.isOpen } : s
        ));
    };

    const updateTime = (i: number, field: "openTime" | "closeTime", val: string) => {
        setSchedules(prev => prev.map((s, idx) =>
            idx === i ? { ...s, [field]: val } : s
        ));
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-1">Horarios de apertura</h2>
                <p className="text-white/50 text-sm">Configura cuándo estás disponible para recibir citas.</p>
            </div>

            <div className="space-y-3">
                {schedules.map((s, i) => (
                    <div
                        key={DAYS[i]}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${s.isOpen ? "bg-white/5 border-white/10" : "bg-black/20 border-white/5 opacity-60"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={s.isOpen}
                                onChange={() => toggleDay(i)}
                                className="w-5 h-5 rounded border-white/10 bg-white/10 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-medium min-w-[80px]">{DAYS[i]}</span>
                        </div>

                        {s.isOpen ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={s.openTime}
                                    onChange={(e) => updateTime(i, "openTime", e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                />
                                <span className="text-white/30 text-xs">a</span>
                                <input
                                    type="time"
                                    value={s.closeTime}
                                    onChange={(e) => updateTime(i, "closeTime", e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        ) : (
                            <span className="text-white/30 text-sm italic">Cerrado</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-medium transition-all text-sm"
                >
                    ← Atrás
                </button>
                <button
                    onClick={() => onNext({ schedules })}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                    Continuar →
                </button>
            </div>
        </div>
    );
}
