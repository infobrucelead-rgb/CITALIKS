import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ical from "ical-generator";

export async function GET(
    req: NextRequest,
    { params }: { params: { clientId: string } }
) {
    try {
        const { clientId } = params;

        // Verify client exists
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
            const end = new Date(start.getTime() + 30 * 60_000); // 30 min default

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
