import DemoPageClient from "./DemoPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Demo en vivo — CitaLiks",
    description: "Prueba gratis el asistente de voz con IA de CitaLiks. Habla con Carolina, nuestra asistente de demostración, y descubre cómo puede gestionar las citas de tu negocio.",
};

export default function DemoPage() {
    return <DemoPageClient />;
}
