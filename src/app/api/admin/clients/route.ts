import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { linkPhoneNumberToAgent } from "@/lib/retell";

export async function PATCH(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // Check if user is platform admin
    const adminClient = await prisma.client.findUnique({
        where: { clerkUserId: userId }
    }) as any;

    if (!adminClient || adminClient.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { clientId, ...updates } = body;

    if (!clientId) return NextResponse.json({ error: "ID de cliente faltante" }, { status: 400 });

    try {
        const updatedClient = await prisma.client.update({
            where: { id: clientId },
            data: updates
        }) as any;

        console.log(`[Admin] Client ${clientId} updated fields:`, Object.keys(updates));

        // Si se está asignando un número de teléfono y el cliente tiene agente de Retell,
        // vincularlo automáticamente al agente
        if (updates.phone && updatedClient.retellAgentId) {
            const linkResult = await linkPhoneNumberToAgent(updatedClient.retellAgentId, updates.phone, updatedClient.id);
            if (linkResult.success) {
                console.log(`[Admin] Número ${updates.phone} vinculado al agente ${updatedClient.retellAgentId}`);
            } else {
                // No bloqueamos la respuesta, pero informamos del estado
                console.warn(`[Admin] Número guardado en BD pero no vinculado en Retell: ${linkResult.error}`);
                return NextResponse.json({
                    success: true,
                    client: updatedClient,
                    warning: `Número guardado. Vinculación con Retell pendiente: ${linkResult.error}`
                });
            }
        }

        return NextResponse.json({ success: true, client: updatedClient });
    } catch (error) {
        console.error("[Admin] Error updating client status:", error);
        return NextResponse.json({ error: "Error al actualizar el estado" }, { status: 500 });
    }
}
export async function DELETE(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const adminClient = await prisma.client.findUnique({
        where: { clerkUserId: userId }
    }) as any;

    if (!adminClient || adminClient.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { clientId } = await req.json();
    if (!clientId) return NextResponse.json({ error: "ID de cliente faltante" }, { status: 400 });

    try {
        // Find client to check for dedicated DB
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

        // Deleting the client record. 
        // Note: In a real multi-tenant setup, we might also want to drop the DB or deprovision the agent.
        // For now, we'll delete the Master record.
        await prisma.client.delete({
            where: { id: clientId }
        });

        console.log(`[Admin] Client ${clientId} deleted by admin ${userId}`);

        return NextResponse.json({ success: true, message: "Cliente eliminado correctamente" });
    } catch (error) {
        console.error("[Admin] Error deleting client:", error);
        return NextResponse.json({ error: "Error al eliminar el cliente" }, { status: 500 });
    }
}
