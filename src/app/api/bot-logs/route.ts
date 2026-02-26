import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const functionFilter = url.searchParams.get("function");

    try {
        const whereClause = `WHERE "clientId" = '${client.id}'${functionFilter ? ` AND "functionName" = '${functionFilter}'` : ''}`;

        const logs = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id, "clientId", "functionName", "inputArgs", "resultJson", 
                   "slotsFound", "scheduleUsed", "errorMsg", "durationMs", 
                   "webhookUrl", "confirmed", "createdAt"
            FROM "bot_logs"
            ${whereClause}
            ORDER BY "createdAt" DESC
            LIMIT ${limit}
        `);

        // Summary stats
        const statsQuery = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                COUNT(*)::int as total,
                SUM(CASE WHEN "errorMsg" IS NOT NULL THEN 1 ELSE 0 END)::int as errors,
                SUM(CASE WHEN "confirmed" = true THEN 1 ELSE 0 END)::int as bookings,
                AVG("slotsFound")::float as avg_slots,
                AVG("durationMs")::float as avg_duration_ms
            FROM "bot_logs"
            WHERE "clientId" = '${client.id}'
        `);

        return NextResponse.json({
            logs,
            stats: statsQuery[0] || {}
        });
    } catch (err: any) {
        console.error("Error fetching bot logs:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
