"use client";
import React, { useState } from "react";
import { Calendar, Mail, Zap, Database, CheckCircle2, Utensils, RefreshCw } from "lucide-react";

export default function Step5Calendar({
    data,
    onNext,
    onBack,
}: {
    data: any;
    onNext: (d: any) => void;
    onBack: (d?: any) => void;
}) {
    const [preferences, setPreferences] = useState({
        wantsGoogleCalendar: data?.wantsGoogleCalendar ?? true,
        wantsMicrosoftOutlook: data?.wantsMicrosoftOutlook ?? false,
        wantsCRM: data?.wantsCRM ?? false,
        wantsPMS: data?.wantsPMS ?? false,
        wantsRestaurant: data?.wantsRestaurant ?? false,
    });

    const [isConnecting, setIsConnecting] = useState(false);

    // Escuchar el mensaje de éxito del popup
    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data === "google-connected") {
                setIsConnecting(false);
                // Forzar recarga de la página para obtener el nuevo estado de la DB
                // o simplemente esperar a que el usuario pulse "Continuar"
                window.location.reload(); 
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const togglePref = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGoogleConnect = () => {
        setIsConnecting(true);
        window.open("/api/google/connect", "google-auth", "width=600,height=700");
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
                <div className="sm:col-span-2">
                    <button
                        onClick={handleGoogleConnect}
                        disabled={isConnecting}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${data?.googleAccessToken ? "bg-green-500/10 border-green-500/30" : "bg-blue-600/10 border-blue-600/30 hover:border-blue-500/50"
                            } ${isConnecting ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data?.googleAccessToken ? "bg-green-500" : "bg-blue-600"} text-white`}>
                                {isConnecting ? <RefreshCw className="animate-spin" size={20} /> : <Calendar size={20} />}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">
                                    {isConnecting ? "Conectando..." : "Vincular con Google Calendar"}
                                </p>
                                <p className="text-[10px] text-white/30">
                                    {data?.googleAccessToken ? "✓ Cuenta vinculada correctamente" : "Necesario para evitar duplicados"}
                                </p>
                            </div>
                        </div>
                        {!data?.googleAccessToken && !isConnecting && <Zap size={16} className="text-blue-400 animate-pulse" />}
                        {isConnecting && <RefreshCw size={16} className="text-blue-400 animate-spin" />}
                        {data?.googleAccessToken && <CheckCircle2 size={16} className="text-green-500" />}
                    </button>
                    {!data?.googleAccessToken && (
                        <p className="text-[10px] text-amber-400/70 mt-2 px-2 italic">
                            ⚠️ Es muy recomendable conectar tu Google Calendar ahora para que el bot no reserve en horas ocupadas.
                        </p>
                    )}
                </div>

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
                    onClick={() => onBack(preferences)}
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
