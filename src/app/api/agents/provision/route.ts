import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, getTenantPrisma } from "@/lib/db";
import { createRetellAgent } from "@/lib/retell";
import { netelip } from "@/lib/netelip";
import { syncBotByClientId } from "@/lib/bot-updates";

// Called at the end of onboarding to provision the Retell agent
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const masterClient = await prisma.client.findUnique({
        where: { clerkUserId: userId },
        include: { services: true, schedules: true, staff: { include: { schedules: true } } },
    }) as any;

    if (!masterClient) {
        return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    let client = masterClient;

    // Fetch from tenant DB if it exists
    if (masterClient.databaseUrl) {
        const tenantPrisma = getTenantPrisma(masterClient.databaseUrl);
        try {
            const tenantData = await tenantPrisma.client.findFirst({
                where: { clerkUserId: userId },
                include: {
                    services: true,
                    schedules: { include: { staff: true } },
                    staff: { include: { schedules: true } }
                }
            });
            if (tenantData) {
                client = { ...masterClient, ...tenantData };
            }
        } catch (err) {
            console.error("Error fetching tenant DB in provision:", err);
        } finally {
            await tenantPrisma.$disconnect();
        }
    }

    if (client.retellAgentId && client.phone) {
        return NextResponse.json({ agentId: client.retellAgentId, message: "Agente y teléfono ya configurados" });
    }

    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL!;

    let agentId = client.retellAgentId;

    // 1. Create Retell agent if not exists
    if (!agentId) {
        try {
            // Use business schedules (those with no staffId) for the general config
            const businessSchedules = (client.schedules || []).filter((s: any) => !s.staffId);

            agentId = await createRetellAgent({
                clientId: client.id,
                businessName: client.businessName ?? "Mi Negocio",
                agentName: client.agentName ?? "Asistente",
                tone: client.agentTone ?? "profesional",
                voice: client.agentVoice ?? "male",
                services: client.services || [],
                schedules: businessSchedules,
                staff: client.staff || [],
                webhookUrl,
            });
        } catch (err: any) {
            console.error("Error creating Retell agent:", err);
            return NextResponse.json(
                { error: "Error al crear el agente en Retell", details: err.message },
                { status: 500 }
            );
        }
    }

    // 2. Assign Netelip phone number
    let phoneInfo = { phoneNumber: client.phone, numberId: client.netelipNumberId };
    if (!client.phone) {
        try {
            const netelipRes = await netelip.assignPhoneNumber(agentId, client.businessName ?? "Negocio");
            phoneInfo = { phoneNumber: netelipRes.phoneNumber, numberId: netelipRes.numberId };
        } catch (err: any) {
            console.error("Error assigning Netelip phone:", err);
            // We continue even if phone fails to allow dashboard access
        }
    }

    await prisma.client.update({
        where: { id: client.id },
        data: {
            retellAgentId: agentId,
            phone: phoneInfo.phoneNumber,
            netelipNumberId: phoneInfo.numberId,
            onboardingDone: true,
            onboardingStep: 6,
        },
    });

    // 3. Final deep sync to ensure LLM prompt is perfect with all data
    try {
        await syncBotByClientId(client.id);
    } catch (syncErr) {
        console.error("Initial deep sync failed:", syncErr);
    }

    return NextResponse.json({
        agentId,
        phone: phoneInfo.phoneNumber,
        netelipNumberId: phoneInfo.numberId,
    });
}
