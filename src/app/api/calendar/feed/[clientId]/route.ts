import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ical from "ical-generator";

/**
 * GET /api/calendar/feed/[clientId]
 *
 * Public iCal feed protected by a secret token to prevent unauthorized access to client data.
 * Usage: /api/calendar/feed/<clientId>?token=<CRON_SECRET>
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ clientId: string }> }
) {
    try {
        // ─── Security: Require CRON_SECRET token ───────────────────────────────
        const token = req.nextUrl.searchParams.get("token");
        const expectedToken = process.env.CRON_SECRET;

        if (!expectedToken || token !== expectedToken) {
            return new NextResponse("Forbidden", { status: 403 });
        }
        // ───────────────────────────────────────────────────────────────────────

        const params = await context.params;
        const { clientId } = params;

        const client = await (prisma.client as any).findUnique({
            where: { id: clientId },
            include: { appointments: { where: { status: "CONFIRMED" } } },
        });

        if (!client) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const calendar = ical({
            name: `Citas - ${client.businessName}`,
            description: `Calendario de citas para ${client.businessName}`,
        });

        (client.appointments as any[]).forEach((apt: any) => {
            const start = new Date(`${apt.date}T${apt.time}:00`);
            const end = new Date(start.getTime() + 30 * 60_000);

            calendar.createEvent({
                start,
                end,
                summary: `${apt.serviceName} - ${apt.callerName}`,
                description: apt.notes || "",
                location: client.city || "",
            });
        });

        return new NextResponse(calendar.toString(), {
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": `attachment; filename="citas_${clientId}.ics"`,
            },
        });
    } catch (error: any) {
        console.error("[api/calendar/feed] Error:", error.message);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
