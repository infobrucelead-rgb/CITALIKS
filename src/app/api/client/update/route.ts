import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { CalendarProvider } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const data = await req.json();

        // Find client by clerkUserId
        const client = await prisma.client.findFirst({
            where: { clerkUserId: userId }
        });

        if (!client) return new NextResponse("Client not found", { status: 404 });

        const updatedClient = await prisma.client.update({
            where: { id: client.id },
            data: {
                activeCalendarProvider: data.activeCalendarProvider,
                pmsProvider: data.pmsProvider,
                pmsApiKey: data.pmsApiKey,
                pmsUrl: data.pmsUrl,
                pmsActive: data.pmsActive,
                icalUrl: data.icalUrl,
                crmProvider: data.crmProvider,
                crmApiKey: data.crmApiKey,
                crmUrl: data.crmUrl,
                crmActive: data.crmActive,
            }
        });

        return NextResponse.json({ success: true, client: updatedClient });
    } catch (err) {
        console.error("[API/ClientUpdate] Error:", err);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
