import { NextRequest, NextResponse } from "next/server";
import { retell } from "@/lib/retell";

/**
 * POST /api/demo/start-call
 * Creates a Retell web call for the public demo page.
 * Returns an access_token that the browser SDK uses to start the call.
 * No authentication required — this is a public endpoint.
 *
 * Agent IDs are hardcoded here as a fallback to guarantee production availability.
 * They can be overridden via environment variables if needed.
 */

// Hardcoded IDs to guarantee production availability regardless of env var configuration
const AGENT_IDS = {
    pablo: process.env.RETELL_PABLO_AGENT_ID || "agent_0b57229b14ce99e87505e1a635",
    carolina: process.env.RETELL_DEMO_AGENT_ID || process.env.RETELL_CAROLINA_AGENT_ID || "agent_b6be22968dd533329d023f6959",
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const agentType = body.agentType || "carolina"; // default to carolina

        const demoAgentId = agentType === "pablo" ? AGENT_IDS.pablo : AGENT_IDS.carolina;

        console.log(`[Demo/StartCall] Using agent ID: ${demoAgentId} for type: ${agentType}`);

        if (!demoAgentId) {
            return NextResponse.json(
                { error: `El asistente de demostración no está configurado.` },
                { status: 503 }
            );
        }

        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        console.log(`[Demo/StartCall] New ${agentType} call from IP: ${ip}`);

        const now = new Date();
        const dateStr = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });
        const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

        const webCallResponse = await (retell as any).call.createWebCall({
            agent_id: demoAgentId,
            retell_llm_dynamic_variables: {
                current_date_es: dateStr,
                current_time_es: timeStr,
            },
            metadata: {
                source: "demo_page",
                agent_type: agentType,
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
