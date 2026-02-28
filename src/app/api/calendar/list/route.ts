import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, getTenantPrisma } from "@/lib/db";
import { listGoogleCalendars } from "@/lib/calendar";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const targetPrisma = (client as any).databaseUrl ? getTenantPrisma((client as any).databaseUrl) : prisma;

    try {
        const calendars = await listGoogleCalendars(client.id, targetPrisma);
        return NextResponse.json({ calendars });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
        if ((client as any).databaseUrl) await (targetPrisma as any).$disconnect();
    }
}
