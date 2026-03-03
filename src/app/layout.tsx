import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";

export const metadata: Metadata = {
    title: "CitaLiks — Asistente de voz con IA para tu negocio",
    description:
        "Gestiona tu agenda automáticamente con un asistente de voz en español. Recibe llamadas, crea y cancela citas 24/7.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider
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
