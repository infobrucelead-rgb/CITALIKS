"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import Step1Business from "./steps/Step1Business";
import Step2Services from "./steps/Step2Services";
import Step3Schedule from "./steps/Step3Schedule";
import Step4Agent from "./steps/Step4Agent";
import Step5Calendar from "./steps/Step5Calendar";
import Step6Launch from "./steps/Step6Launch";

const STEPS = [
    "Tu negocio",
    "Servicios",
    "Horarios",
    "Tu agente",
    "Calendario",
    "¡Lanzar!",
];

export type OnboardingData = {
    businessName: string;
    businessType: string;
    city: string;
    services: Array<{ name: string; durationMin: number; price?: number }>;
    schedules: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean }>;
    agentName: string;
    agentTone: "profesional" | "cercano";
    transferPhone?: string;
};

async function saveStep(step: number, data: Partial<OnboardingData>, token?: string) {
    await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data, token }),
    });
}

function OnboardingContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(1);
    const searchParams = useSearchParams();
    const [data, setData] = useState<Partial<OnboardingData>>({
        services: [],
        schedules: [
            { dayOfWeek: 0, openTime: "09:00", closeTime: "20:00", isOpen: true },
            { dayOfWeek: 1, openTime: "09:00", closeTime: "20:00", isOpen: true },
            { dayOfWeek: 2, openTime: "09:00", closeTime: "20:00", isOpen: true },
            { dayOfWeek: 3, openTime: "09:00", closeTime: "20:00", isOpen: true },
            { dayOfWeek: 4, openTime: "09:00", closeTime: "20:00", isOpen: true },
            { dayOfWeek: 5, openTime: "10:00", closeTime: "14:00", isOpen: false },
            { dayOfWeek: 6, openTime: "10:00", closeTime: "14:00", isOpen: false },
        ],
        agentName: "Asistente",
        agentTone: "profesional",
    });

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            fetch(`/api/invitations/validate?token=${token}`)
                .then(res => res.json())
                .then(json => {
                    if (json.invitation) {
                        setData(prev => ({
                            ...prev,
                            businessName: json.invitation.businessName ?? "",
                        }));
                    }
                });
        }
    }, [searchParams]);

    useEffect(() => {
        async function loadState() {
            try {
                const res = await fetch("/api/onboarding");
                const json = await res.json();
                if (json.client) {
                    setData((prev) => ({
                        ...prev,
                        businessName: json.client.businessName ?? "",
                        businessType: json.client.businessType ?? "",
                        city: json.client.city ?? "",
                        agentName: json.client.agentName ?? "Asistente",
                        agentTone: json.client.agentTone ?? "profesional",
                        transferPhone: json.client.transferPhone ?? "",
                        services: json.client.services ?? [],
                        schedules: json.client.schedules.length > 0 ? json.client.schedules : prev.schedules,
                        googleAccessToken: json.client.googleAccessToken, // Pass this to detect connection
                    }));
                    if (json.client.onboardingStep !== undefined) {
                        // Resume at the NEXT step (max 6)
                        // If they just finished step 4, they should be at step 5.
                        setStep(Math.min(json.client.onboardingStep + 1, 6));
                    }
                }
            } catch (err) {
                console.error("Error loading onboarding state:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadState();
    }, []);

    const next = async (stepData: Partial<OnboardingData>) => {
        const merged = { ...data, ...stepData };
        setData(merged);
        const token = searchParams.get("token");
        await saveStep(step, stepData, token || undefined);
        if (step < 6) setStep(step + 1);
    };

    const back = () => setStep((s) => Math.max(1, s - 1));

    const progress = ((step - 1) / (STEPS.length - 1)) * 100;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-animated flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SignOutButton redirectUrl="/">
                        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Cerrar la sesión actual y volver al Inicio">
                            <img src="/logo.png" alt="CitaLiks Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
                            <span className="text-white font-bold text-lg">Cita<span className="gradient-text">Liks</span></span>
                        </button>
                    </SignOutButton>
                    <div className="w-px h-6 bg-white/20 mx-2" />
                    <span className="text-white/40 text-sm">Configurando tu asistente</span>
                </div>
                <div>
                    <UserButton />
                </div>
            </div>

            {/* Progress */}
            <div className="px-8 pb-8 max-w-2xl mx-auto w-full">
                <div className="flex justify-between mb-3">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i + 1 < step
                                ? "bg-blue-500 text-white"
                                : i + 1 === step
                                    ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent"
                                    : "bg-white/10 text-white/30"
                                }`}>
                                {i + 1 < step ? "✓" : i + 1}
                            </div>
                            <span className={`text-xs hidden md:block ${i + 1 === step ? "text-blue-300" : "text-white/30"}`}>
                                {s}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Step content */}
            <div className="flex-1 flex items-start justify-center px-4 pb-12">
                <div className="glass rounded-3xl p-8 w-full max-w-2xl text-white">
                    {step === 1 && <Step1Business data={data} onNext={next} />}
                    {step === 2 && <Step2Services data={data} onNext={next} onBack={back} />}
                    {step === 3 && <Step3Schedule data={data} onNext={next} onBack={back} />}
                    {step === 4 && <Step4Agent data={data} onNext={next} onBack={back} />}
                    {step === 5 && <Step5Calendar data={data} onNext={next} onBack={back} />}
                    {step === 6 && <Step6Launch data={data} onFinish={() => router.push("/dashboard")} />}
                </div>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    );
}
