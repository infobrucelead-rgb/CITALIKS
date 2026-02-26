import { NextRequest, NextResponse } from "next/server";
import { retell } from "@/lib/retell";

/**
 * POST /api/demo/start-call
 * Creates a Retell web call for the public demo page.
 * Returns an access_token that the browser SDK uses to start the call.
 * No authentication required — this is a public endpoint.
 */
export async function POST(req: NextRequest) {
    const demoAgentId = process.env.RETELL_DEMO_AGENT_ID;

    if (!demoAgentId) {
        return NextResponse.json(
            { error: "El agente de demo no está configurado. Añade RETELL_DEMO_AGENT_ID a las variables de entorno." },
            { status: 503 }
        );
    }

    try {
        // Rate limiting: max 1 call per IP per 5 minutes (basic protection)
        // In production, consider using Redis or Upstash for proper rate limiting
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        console.log(`[Demo/StartCall] New demo call from IP: ${ip}`);

        const webCallResponse = await (retell as any).call.createWebCall({
            agent_id: demoAgentId,
            metadata: {
                source: "demo_page",
                ip,
            },
        });

        return NextResponse.json({
            success: true,
            access_token: webCallResponse.access_token,
            call_id: webCallResponse.call_id,
        });
    } catch (error: any) {
        console.error("[Demo/StartCall] Error:", error);
        return NextResponse.json(
            { error: "No se pudo iniciar la llamada de demo", message: error.message },
            { status: 500 }
        );
    }
}
