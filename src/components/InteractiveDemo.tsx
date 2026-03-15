"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Play, Pause, RotateCcw, Mic } from "lucide-react";

const transcriptData: Array<{ speaker: "bot" | "user", text: string }> = [
    { speaker: "bot", text: "Hola, soy Pablo de CitaLiks. ¿En qué puedo ayudarte hoy?" },
];

export default function InteractiveDemo() {
    const [isCalling, setIsCalling] = useState(false);
    const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active" | "error">("idle");
    const [transcript, setTranscript] = useState<Array<{ speaker: "bot" | "user", text: string }>>(transcriptData);
    const [retellClient, setRetellClient] = useState<any>(null);

    const startCall = async () => {
        setCallStatus("connecting");
        try {
            const res = await fetch("/api/demo/start-call", { 
                method: "POST",
                body: JSON.stringify({ agentType: "pablo" })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error);

            const { RetellWebClient } = await import("retell-client-js-sdk");
            const client = new RetellWebClient();

            client.on("call_started", () => {
                setCallStatus("active");
                setIsCalling(true);
            });

            client.on("call_ended", () => {
                setCallStatus("idle");
                setIsCalling(false);
            });

            client.on("update", (update: any) => {
                if (update.transcript) {
                    const last = update.transcript[update.transcript.length - 1];
                    if (last) {
                        setTranscript(prev => {
                            const newMsg = { speaker: last.role === "agent" ? "bot" : "user", text: last.content };
                            // Simple logic to avoid duplicate appends if needed, 
                            // but Retell SDK 'update' usually gives the full transcript or delta.
                            // For simplicity in a demo, we'll just map the whole thing.
                            return update.transcript.map((t: any) => ({
                                speaker: (t.role === "agent" ? "bot" : "user") as "bot" | "user",
                                text: t.content
                            }));
                        });
                    }
                }
            });

            client.on("error", (err: any) => {
                console.error("Retell error:", err);
                setCallStatus("error");
            });

            await client.startCall({
                accessToken: data.access_token,
                sampleRate: 24000,
            });

            setRetellClient(client);
        } catch (err) {
            console.error(err);
            setCallStatus("error");
        }
    };

    const stopCall = () => {
        if (retellClient) {
            retellClient.stopCall();
            setRetellClient(null);
        }
        setCallStatus("idle");
    };

    const reset = () => {
        stopCall();
        setTranscript([...transcriptData]);
    };

    return (
        <div className="bg-surface-container rounded-[2.5rem] p-8 lg:p-10 overflow-hidden relief-premium space-y-8 relative border border-black/40">
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden shadow-inner logo-neon">
                        <img src="/logo.png" alt="CitaLiks - Pablo, tu Asistente de Voz Inteligente" className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-white tracking-tight">Pablo</p>
                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] opacity-80">
                            {callStatus === "active" ? "Escuchando..." : "En línea"}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={reset}
                        className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/40"
                    >
                        <RotateCcw size={20} />
                    </button>
                    <button 
                        onClick={callStatus === "active" ? stopCall : startCall}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                            callStatus === "active" ? "bg-red-500 text-white" : "bg-primary text-black"
                        }`}
                    >
                        {callStatus === "active" ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </button>
                </div>
            </div>

            <div className="min-h-[300px] flex flex-col gap-4 overflow-y-auto max-h-[400px] pr-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {transcript.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
                            <Mic size={48} className="mb-4" />
                            <p className="text-sm font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Pulsa el botón para iniciar una conversación real</p>
                        </div>
                    )}
                    {transcript.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] font-medium border border-black/50 shadow-xl ${
                                msg.speaker === "bot" 
                                    ? "bg-primary/15 text-white self-end rounded-tr-none" 
                                    : "bg-white/5 text-white/90 self-start rounded-tl-none"
                            }`}
                            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}
                        >
                            <span className="block text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">
                                {msg.speaker === "bot" ? "Pablo (IA)" : "Tú"}
                            </span>
                            <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                                {msg.text}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {callStatus === "active" && (
                <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-center gap-1.5 h-8">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: [8, 24, 12, 18, 8] }}
                                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
                                className="w-1 bg-primary rounded-full opacity-60"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
