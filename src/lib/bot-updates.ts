import { prisma, getTenantPrisma } from "./db";
import { updateRetellAgent } from "./retell";

export async function syncBotWithBusinessData(clerkUserId: string) {
    const client = await prisma.client.findUnique({
        where: { clerkUserId },
    });
    if (!client) return;
    return syncBotByClientId(client.id);
}

export async function syncBotByClientId(clientId: string) {
    // 1. Get client from master to find retellAgentId and databaseUrl
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { services: true, schedules: true, staff: true } as any
    }) as any;

    if (!client || !client.retellAgentId) return;

    // 2. Use the correct Prisma instance to get the latest data
    let businessData: any = client;
    const clerkUserId = client.clerkUserId;
    let tenantPrisma: any = null;

    try {
        if (client.databaseUrl) {
            tenantPrisma = getTenantPrisma(client.databaseUrl);
            const tenantClient = await tenantPrisma.client.findFirst({
                where: { clerkUserId },
                include: {
                    services: true,
                    schedules: { include: { staff: true } },
                    staff: { include: { schedules: true } }
                }
            });
            if (tenantClient) businessData = tenantClient;
        }
    } catch (err) {
        console.error(`[SyncBot] Error fetching tenant data for ${clientId}:`, err);
    }

    try {
        // 3. Update Retell Agent Prompt with the latest data
        await updateRetellAgent(client.retellAgentId, {
            clientId: client.id,
            businessName: client.businessName || "Negocio",
            agentName: client.agentName || "Asistente",
            tone: client.agentTone || "profesional",
            voice: client.agentVoice || "male",
            transferPhone: client.transferPhone,
            services: (businessData.services || []).map((s: any) => ({
                name: s.name,
                durationMin: s.durationMin,
                price: s.price
            })),
            schedules: (businessData.schedules || []).filter((s: any) => !s.staffId),
            staff: (businessData.staff || []).map((st: any) => ({
                name: st.name,
                schedules: st.schedules || []
            })),
            webhookUrl: process.env.NEXT_PUBLIC_APP_URL || "https://www.citaliks.com"
        });

        console.log(`[SyncBot] Successfully synced agent ${client.retellAgentId} for client ${clientId}`);
    } catch (error) {
        console.error(`[SyncBot] Error updating Retell agent for ${clientId}:`, error);
        throw error;
    } finally {
        if (tenantPrisma) {
            try {
                await tenantPrisma.$disconnect();
            } catch (err) {
                console.error("[SyncBot] Disconnect error:", err);
            }
        }
    }
}
