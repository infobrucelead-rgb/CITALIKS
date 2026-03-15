"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PricingCheckoutButtonProps {
    planId: string;
    label: string;
    variant?: "primary" | "secondary";
    className?: string;
}

export default function PricingCheckoutButton({ 
    planId, 
    label, 
    variant = "primary",
    className = ""
}: PricingCheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/stripe/chat-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId })
            });
            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || "Error al procesar el pago");
                setIsLoading(false);
            }
        } catch (err) {
            alert("Error de conexión con la pasarela.");
            setIsLoading(false);
        }
    };

    const baseStyles = "w-full py-4 rounded-xl font-black transition-all text-center uppercase tracking-widest text-xs flex items-center justify-center gap-2";
    const variantStyles = variant === "primary" 
        ? "bg-primary text-black glow-hover shadow-xl shadow-primary/20" 
        : "border-2 border-primary/30 text-primary hover:bg-primary hover:text-black";

    return (
        <button
            onClick={handleCheckout}
            disabled={isLoading}
            className={`${baseStyles} ${variantStyles} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {label}
        </button>
    );
}
