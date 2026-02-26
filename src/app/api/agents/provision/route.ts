import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { createRetellAgent } from "@/lib/retell";
import { netelip } from "@/lib/netelip";

// Called at the end of onboarding to provision the Retell agent
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
        where: { clerkUserId: userId },
        include: { services: true, schedules: true, staff: true },
    }) as any;

    if (!client) {
        return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    if (client.retellAgentId && client.phone) {
        return NextResponse.json({ agentId: client.retellAgentId, message: "Agente y teléfono ya configurados" });
    }

    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL!;

    let agentId = client.retellAgentId;

    // 1. Create Retell agent if not exists
    if (!agentId) {
        try {
            agentId = await createRetellAgent({
                clientId: client.id,
                businessName: client.businessName ?? "Mi Negocio",
                agentName: client.agentName ?? "Asistente",
                tone: client.agentTone ?? "profesional",
                services: client.services || [],
                schedules: client.schedules || [],
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

    return NextResponse.json({
        agentId,
        phone: phoneInfo.phoneNumber,
        message: "Agente creado y teléfono asignado correctamente"
    });
}
