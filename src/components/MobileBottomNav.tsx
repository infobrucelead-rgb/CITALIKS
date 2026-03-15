"use client";

import React from "react";
import Link from "next/link";
import { Home, Play, CreditCard, MessageCircle } from "lucide-react";

export default function MobileBottomNav() {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 glass-mobile-nav">
            <div className="flex items-center justify-around bg-white/5 rounded-full py-3 px-6 border border-white/10 shadow-2xl backdrop-blur-xl">
                <Link href="/" className="flex flex-col items-center gap-1 active-feedback">
                    <Home size={22} className="text-white/60" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/40">Inicio</span>
                </Link>
                <Link href="/demo" className="flex flex-col items-center gap-1 active-feedback">
                    <Play size={22} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-primary">Demo</span>
                </Link>
                <a href="#pricing" className="flex flex-col items-center gap-1 active-feedback">
                    <CreditCard size={22} className="text-white/60" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/40">Precios</span>
                </a>
                <Link href="https://wa.me/34600000000" target="_blank" className="flex flex-col items-center gap-1 active-feedback">
                    <MessageCircle size={22} className="text-white/60" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/40">WhatsApp</span>
                </Link>
            </div>
        </nav>
    );
}
