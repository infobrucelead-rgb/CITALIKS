import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateRetellAgent } from "@/lib/retell";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Security check for Vercel Cron or manual authorized trigger
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("[Cron/RefreshPrompts] Starting global prompt refresh...");

    try {
        const clients = await prisma.client.findMany({
            where: {
                retellAgentId: { not: null }
            },
            include: {
                services: true,
                schedules: true,
                staff: {
                    include: { schedules: true }
                }
            }
        }) as any[];

        const results = {
            total: clients.length,
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.citaliks.com";

        for (const client of clients) {
            try {
                await updateRetellAgent(client.retellAgentId, {
                    clientId: client.id,
                    businessName: client.businessName || "Negocio",
                    agentName: client.agentName || "Asistente",
                    tone: client.agentTone || "profesional",
                    services: client.services,
                    schedules: client.schedules,
                    staff: client.staff,
                    transferPhone: client.transferPhone,
                    webhookUrl: appUrl
                });
                results.success++;
            } catch (err: any) {
                results.failed++;
                results.errors.push(`${client.businessName}: ${err.message}`);
                console.error(`[Cron/RefreshPrompts] Failed for ${client.businessName}:`, err.message);
            }
        }

        console.log(`[Cron/RefreshPrompts] Finished. Success: ${results.success}, Failed: ${results.failed}`);

        return NextResponse.json({
            message: "Proceso de actualización completado",
            results
        });

    } catch (error: any) {
        console.error("[Cron/RefreshPrompts] Critical Error:", error);
        return NextResponse.json({ error: "Error crítico en el proceso", message: error.message }, { status: 500 });
    }
}
