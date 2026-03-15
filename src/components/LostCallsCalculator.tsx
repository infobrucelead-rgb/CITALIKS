"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LostCallsCalculator() {
    const [callsPerDay, setCallsPerDay] = useState(25);

    // Business Logic based on industry studies (Forbes/HBR)
    // 25% of business calls go unanswered (Forbes)
    // 85% of missed callers will call a competitor immediately (Industry Standard)
    // 70% average booking conversion for answered calls
    const missedCallsPerMonth = Math.round(callsPerDay * 0.25 * 22);
    const estimatedLostClients = Math.round(missedCallsPerMonth * 0.85 * 0.7);

    return (
        <section className="py-24 bg-surface relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-surface-container rounded-[3rem] p-12 lg:p-16 text-center relief-premium relative z-10">
                    <div className="space-y-4 mb-16">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">Calcula lo que estás perdiendo</h2>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-60">¿CUÁNTAS LLAMADAS RECIBES AL DÍA?</p>
                    </div>

                    <div className="px-4 mb-16">
                        <input
                            type="range"
                            min="10"
                            max="100"
                            step="10"
                            value={callsPerDay}
                            onChange={(e) => setCallsPerDay(parseInt(e.target.value))}
                            className="premium-slider"
                        />
                        <div className="flex justify-between mt-4 text-[10px] font-bold text-white/60 uppercase tracking-widest px-2">
                            {[10, 20, 30, 40, 50, 60, 70, 80, 90, "100+"].map((val) => (
                                <span key={val}>{val}</span>
                            ))}
                        </div>
                    </div>

                    <motion.div 
                        layout
                        className="bg-black/40 rounded-[2.5rem] p-8 md:p-12 border border-white/5 flex flex-col items-center md:flex-row md:items-center justify-between gap-10"
                    >
                        <div className="text-center md:text-left space-y-2">
                            <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Clientes perdidos estimados / mes</p>
                            <div className="flex items-baseline justify-center md:justify-start gap-2">
                                <span className="text-6xl md:text-8xl font-black text-primary leading-none glow-text">~ {estimatedLostClients}</span>
                                <span className="text-xl md:text-2xl font-black text-primary/60 uppercase">clientes</span>
                            </div>
                            <p className="text-[9px] text-white/60 italic mt-2 uppercase tracking-tighter">*Segun estudios de Forbes y el Harvard Business Review sobre atención al cliente.</p>
                        </div>

                        <Link 
                            href="https://calendly.com/citaliks/30min" 
                            target="_blank"
                            className="w-full md:w-auto bg-primary text-black px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform active:scale-95 text-center"
                        >
                            Evita perder clientes
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
