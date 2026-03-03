import { prisma } from "./src/lib/db";
import { updateRetellAgent } from "./src/lib/retell";
import dotenv from "dotenv";

dotenv.config();

async function diagnose() {
    const clientId = process.argv[2];
    if (!clientId) {
        console.error("Uso: npx ts-node diag_retell.ts <clientId>");
        process.exit(1);
    }

    console.log(`Buscando cliente ${clientId}...`);
    try {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                services: true,
                schedules: true,
                staff: {
                    include: { schedules: true }
                }
            }
        }) as any;

        if (!client) {
            console.error("Cliente no encontrado");
            return;
        }

        console.log(`Actualizando agente ${client.retellAgentId} para ${client.businessName}...`);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.citaliks.com";

        await updateRetellAgent(client.retellAgentId, {
            clientId: client.id,
            businessName: client.businessName || "Negocio",
            agentName: client.agentName || "Asistente",
            tone: client.agentTone || "profesional",
            services: client.services,
            schedules: client.schedules,
            staff: client.staff,
            webhookUrl: appUrl
        });

        console.log("¡Éxito!");
    } catch (err: any) {
        console.error("ERROR DETECTADO:");
        console.error(err);
        if (err.response) {
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
        }
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
