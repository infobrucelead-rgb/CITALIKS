import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, getTenantPrisma } from "@/lib/db";
import { listEvents } from "@/lib/calendar";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const url = new URL(req.url);
    const staffId = url.searchParams.get("staffId");

    const targetPrisma = (client as any).databaseUrl ? getTenantPrisma((client as any).databaseUrl) : prisma;

    try {
        let googleCalendarId: string | undefined = undefined;
        let staffName: string | undefined = undefined;

        if (staffId) {
            const staff = await (targetPrisma as any).staff.findUnique({
                where: { id: staffId, clientId: client.id }
            });
            if (staff) {
                googleCalendarId = staff.googleCalendarId || "primary";
                staffName = staff.name;
            }
        }

        const events = await listEvents(client.id, {
            staffCalendarId: googleCalendarId,
            staffName: staffName,
            prismaOverride: targetPrisma
        });
        return NextResponse.json({ events });
    } catch (err: any) {
        console.error("Error listing events:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
        if ((client as any).databaseUrl) await (targetPrisma as any).$disconnect();
    }
}
