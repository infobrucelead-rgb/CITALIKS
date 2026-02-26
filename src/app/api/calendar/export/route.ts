import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Parser } from "json2csv";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("clientId");

        if (!clientId) {
            return new NextResponse("Missing clientId", { status: 400 });
        }

        const client = await (prisma.client as any).findUnique({
            where: { id: clientId },
            include: {
                appointments: {
                    where: { status: "CONFIRMED" },
                    orderBy: { date: "asc" }
                }
            },
        });

        if (!client || (client.appointments as any[]).length === 0) {
            return new NextResponse("No appointments found", { status: 404 });
        }

        const appointments = client.appointments as any[];

        const fields = [
            "date",
            "time",
            "callerName",
            "serviceName",
            "staffName",
            "status",
            "notes",
            "createdAt"
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(appointments);

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="citas_${clientId}.csv"`,
            },
        });
    } catch (error: any) {
        console.error("[api/calendar/export] Error:", error.message);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
