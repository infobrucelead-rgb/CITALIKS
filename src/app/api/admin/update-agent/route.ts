import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { syncBotByClientId } from "@/lib/bot-updates";

// ── POST: Regenerate Retell agent prompt for a client ─────────────────────
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const admin = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
    if (!admin || admin.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    try {
        const { clientId } = await req.json();
        if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 });

        await syncBotByClientId(clientId);

        console.log(`[Admin/UpdateAgent] Agent sync triggered for client ${clientId} by admin ${userId}`);

        return NextResponse.json({
            success: true,
            message: `Agente de ${clientId} actualizado correctamente con los últimos datos de la base de datos`,
        });
    } catch (error: any) {
        console.error("[Admin/UpdateAgent] Error:", error);

        return NextResponse.json({
            error: `Error al actualizar agente: ${error.message || "Desconocido"}`
        }, { status: 500 });
    }
}
