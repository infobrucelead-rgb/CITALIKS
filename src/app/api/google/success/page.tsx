"use client";
import { useEffect } from "react";

export default function GoogleSuccessPage() {
    useEffect(() => {
        // Enviar mensaje a la ventana padre (Onboarding)
        if (window.opener) {
            window.opener.postMessage("google-connected", "*");
        }
        
        // Cerrar el popup automáticamente después de un breve delay
        const timer = setTimeout(() => {
            window.close();
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h1 className="text-2xl font-black mb-2">¡Conexión Exitosa!</h1>
            <p className="text-white/50 text-sm max-w-[250px]">
                Tu Google Calendar se ha vinculado correctamente. Esta ventana se cerrará en un momento...
            </p>
            <div className="mt-8 flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full animate-pulse [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-emerald-400/30 rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
        </div>
    );
}
