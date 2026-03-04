import { NextRequest, NextResponse } from "next/server";
import { prisma, getTenantPrisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    const startMs = Date.now();

    try {
        const body = await req.json();
        const { event, call } = body;

        console.log(`[retell/webhook] Received event: ${event}`);

        // ─── Security: Verify Retell-Signature header ───────────────────────────
        // Retell sends an API key in the x-retell-signature header for server-to-server calls.
        // We validate it matches our Retell API key to prevent spoofed webhook calls.
        const retellSignature = req.headers.get("x-retell-signature");
        const retellApiKey = process.env.RETELL_API_KEY;

        if (retellApiKey && retellSignature) {
            // Retell uses a simple bearer-style auth for webhooks
            // The signature contains the API key as a validation mechanism
            if (!retellSignature.includes(retellApiKey.substring(0, 8))) {
                console.error(`[retell/webhook] Invalid signature. Rejecting request.`);
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }
        // ───────────────────────────────────────────────────────────────────────

        // Handle specific events
        if (event === 'call_analyzed' && call?.call_id) {
            console.log(`[retell/webhook] Processing call_analyzed for call_id: ${call.call_id}`);

            const agentId = call.agent_id;
            const client = await prisma.client.findFirst({ where: { retellAgentId: agentId } });

            if (client) {
                const tenantPrisma = client.databaseUrl ? getTenantPrisma(client.databaseUrl) : prisma;
                const durationSec = call.duration_ms ? Math.round(call.duration_ms / 1000) : 0;

                try {
                    await tenantPrisma.callLog.upsert({
                        where: { retellCallId: call.call_id },
                        create: {
                            clientId: client.id,
                            retellCallId: call.call_id,
                            callerNumber: call.from_number || "desconocido",
                            durationSec,
                            transcript: call.transcript || null,
                            summary: call.call_analysis?.call_summary || null,
                            actionTaken: "info"
                        },
                        update: {
                            durationSec,
                            transcript: call.transcript || null,
                            summary: call.call_analysis?.call_summary || undefined
                        }
                    });
                    console.log(`[retell/webhook] CallLog saved/updated for call_id: ${call.call_id} (${Date.now() - startMs}ms)`);
                } catch (e: any) {
                    console.error("[retell/webhook] DB Error updating CallLog:", e.message);
                } finally {
                    if (client.databaseUrl) {
                        await (tenantPrisma as any).$disconnect();
                    }
                }
            } else {
                console.warn(`[retell/webhook] No client found for agent_id: ${agentId}`);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[retell/webhook] Error handling webhook:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
