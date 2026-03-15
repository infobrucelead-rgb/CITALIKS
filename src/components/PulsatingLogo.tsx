"use client";

import { motion } from "framer-motion";

export default function PulsatingLogo() {
    return (
        <motion.div 
            animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                    "0 0 20px rgba(32,185,95,0.2)",
                    "0 0 40px rgba(32,185,95,0.6)",
                    "0 0 20px rgba(32,185,95,0.2)"
                ]
            }}
            transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className="p-4 rounded-3xl bg-white/5 border-2 border-white shadow-[0_0_50px_rgba(32,185,95,0.2)] logo-neon transition-transform duration-500"
        >
            <img src="/logo.png" alt="CitaLiks Logo" className="w-20 h-20 object-contain" />
        </motion.div>
    );
}
