import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";

export const metadata: Metadata = {
    title: "CitaLiks — Asistente de voz con IA para tu negocio",
    description:
        "Gestiona tu agenda automáticamente con un asistente de voz en español. Recibe llamadas, crea y cancela citas 24/7.",
    verification: {
        google: "HQLjY9WbHPOvRP_NTUezf-rxLUV9PiMm5foamCT_M3g",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider
            appearance={{
                elements: {
                    formButtonPrimary: "bg-emerald-600 hover:bg-emerald-500 text-sm",
                    card: "glass border-white/5 shadow-2xl",
                    headerTitle: "text-white",
                    headerSubtitle: "text-white/60",
                    socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
                    socialButtonsBlockButtonText: "text-white",
                    dividerLine: "bg-white/10",
                    dividerText: "text-white/40",
                    formFieldLabel: "text-white/70",
                    formFieldInput: "bg-white/5 border-white/20 text-white",
                    footerActionLink: "text-emerald-400 hover:text-emerald-300",
                    identityPreviewText: "text-white",
                    identityPreviewEditButtonIcon: "text-emerald-400",
                    otpCodeFieldInput: "bg-white/5 border-white/20 text-white border focus:border-emerald-500",
                    formResendCodeLink: "text-emerald-400 hover:text-emerald-300 font-bold",
                }
            }}
            localization={{
                ...esES,
                signIn: {
                    ...esES.signIn,
                    start: {
                        ...esES.signIn?.start,
                        title: "Entrar",
                        subtitle: "para continuar a CitaLiks",
                    },
                },
                signUp: {
                    ...esES.signUp,
                    start: {
                        ...esES.signUp?.start,
                        title: "Crear cuenta",
                        subtitle: "para continuar a CitaLiks",
                    },
                },
            }}
        >
            <html lang="es" suppressHydrationWarning>
                <body suppressHydrationWarning>{children}</body>
            </html>
        </ClerkProvider>
    );
}
