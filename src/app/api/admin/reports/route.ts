import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, getTenantPrisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // Verify Platform Admin
    const admin = await prisma.client.findUnique({
        where: { clerkUserId: userId }
    }) as any;

    if (!admin || admin.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { clientId, dateFrom, dateTo } = await req.json();

    if (!clientId) return NextResponse.json({ error: "clientId es requerido" }, { status: 400 });

    try {
        // Find client to check for dedicated DB
        const masterClient = await prisma.client.findUnique({ where: { id: clientId } }) as any;
        if (!masterClient) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

        let activePrisma: any = prisma;
        let tenantPrisma: any = null;

        if (masterClient.databaseUrl) {
            tenantPrisma = getTenantPrisma(masterClient.databaseUrl);
            activePrisma = tenantPrisma;
        }

        const where: any = { clientId };
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const logs = await activePrisma.callLog.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // Simple aggregation
        const totalCalls = logs.length;
        const totalDurationSec = logs.reduce((acc: number, log: any) => acc + (log.durationSec || 0), 0);
        const bookedCount = logs.filter((log: any) => log.actionTaken === 'booked').length;

        if (tenantPrisma) await tenantPrisma.$disconnect();

        return NextResponse.json({
            success: true,
            summary: {
                totalCalls,
                totalDurationSec,
                bookedCount,
                averageDurationSec: totalCalls > 0 ? Math.round(totalDurationSec / totalCalls) : 0
            },
            logs
        });
    } catch (error: any) {
        console.error("[Admin/Reports] Error:", error);
        return NextResponse.json({ error: "Error al generar el informe", message: error.message }, { status: 500 });
    }
}
