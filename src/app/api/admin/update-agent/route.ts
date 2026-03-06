import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { updateRetellAgent } from "@/lib/retell";
import fs from "fs";
import path from "path";

// ── POST: Regenerate Retell agent prompt for a client ─────────────────────
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const admin = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
    if (!admin || admin.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { clientId } = await req.json();
    if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 });

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

        if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
        if (!client.retellAgentId) return NextResponse.json({ error: "Este cliente no tiene agente de Retell configurado" }, { status: 400 });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.citaliks.com";

        await updateRetellAgent(client.retellAgentId, {
            clientId: client.id,
            businessName: client.businessName || "Negocio",
            agentName: client.agentName || "Asistente",
            tone: client.agentTone || "profesional",
            voice: client.agentVoice || "male",
            services: client.services,
            schedules: client.schedules,
            staff: client.staff,
            transferPhone: client.transferPhone,
            webhookUrl: appUrl
        });

        console.log(`[Admin/UpdateAgent] Agent ${client.retellAgentId} updated for client ${clientId} by admin ${userId}`);

        return NextResponse.json({
            success: true,
            message: `Agente de ${client.businessName} actualizado correctamente`,
            agentId: client.retellAgentId
        });
    } catch (error: any) {
        console.error("[Admin/UpdateAgent] Error:", error);

        console.error("[Admin/UpdateAgent] Error Details:", {
            message: error.message,
            stack: error.stack,
            response: error.response?.data || error.response || "No response data"
        });

        return NextResponse.json({ error: `Error Retell: ${error.message || "Desconocido"}` }, { status: 500 });
    }
}
