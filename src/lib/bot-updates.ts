import { prisma, getTenantPrisma } from "./db";
import { updateRetellAgent } from "./retell";

export async function syncBotWithBusinessData(clerkUserId: string) {
    // 1. Get client from master to find retellAgentId and databaseUrl
    const client = await prisma.client.findUnique({
        where: { clerkUserId },
        include: { services: true, schedules: true, staff: true } as any
    }) as any;

    if (!client || !client.retellAgentId) return;

    // 2. Use the correct Prisma instance to get the latest data
    let activePrisma = prisma;
    let tenantPrisma: any = null;
    let businessData: any = client;

    if (client.databaseUrl) {
        tenantPrisma = getTenantPrisma(client.databaseUrl);
        activePrisma = tenantPrisma;

        const tenantClient = await tenantPrisma.client.findFirst({
            where: { clerkUserId },
            include: { services: true, schedules: true, staff: true }
        });

        if (tenantClient) businessData = tenantClient;
    }

    try {
        console.log(`[BotSync] Syncing Retell agent ${client.retellAgentId} for ${client.businessName}`);

        await updateRetellAgent(client.retellAgentId, {
            clientId: client.id,
            businessName: client.businessName || "Negocio",
            agentName: client.agentName || "Asistente",
            tone: client.agentTone || "profesional",
            voice: client.agentVoice || "male",
            services: (businessData.services || []).map((s: any) => ({
                name: s.name,
                durationMin: s.durationMin,
                price: s.price
            })),
            schedules: (businessData.schedules || []).map((s: any) => ({
                dayOfWeek: s.dayOfWeek,
                openTime: s.openTime,
                closeTime: s.closeTime,
                isOpen: s.isOpen
            })),
            staff: (businessData.staff || []).map((s: any) => ({
                id: s.id,
                name: s.name,
                googleCalendarId: s.googleCalendarId
            })),
            webhookUrl: process.env.NEXT_PUBLIC_APP_URL || "https://www.citaliks.com"
        });
    } catch (error) {
        console.error("[BotSync] Error syncing bot:", error);
    } finally {
        if (tenantPrisma) await tenantPrisma.$disconnect();
    }
}
