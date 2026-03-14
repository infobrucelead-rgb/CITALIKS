import { updateRetellAgent } from "../src/lib/retell";
import { prisma } from "../src/lib/db";

async function run() {
    console.log("Iniciando sincronización global de agentes...");
    const clients = await prisma.client.findMany({
        where: { retellAgentId: { not: null } },
        include: { services: true, schedules: true, staff: true }
    });

    for (const client of clients) {
        try {
            console.log(`--- Sincronizando agente para: ${client.businessName} (${client.retellAgentId}) ---`);
            console.log(`Config: ${JSON.stringify({ clientId: client.id, businessName: client.businessName, agentName: client.agentName, webhookUrl: "https://www.citaliks.com" })}`);
            await updateRetellAgent(client.retellAgentId!, {
                clientId: client.id,
                businessName: client.businessName || "Negocio",
                agentName: client.agentName || "Asistente",
                tone: client.agentTone || "profesional",
                services: client.services as any,
                schedules: client.schedules as any,
                staff: (client as any).staff || [],
                webhookUrl: "https://www.citaliks.com", // URL de producción
                transferPhone: client.phone // O el que corresponda
            });
            console.log(`✅ Agente ${client.retellAgentId} actualizado.`);
        } catch (err) {
            console.error(`❌ Error al actualizar agente ${client.retellAgentId}:`, err.message);
        }
    }
    console.log("Sincronización global finalizada.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
