import { NextRequest, NextResponse } from "next/server";
import { updateRetellAgent } from "@/lib/retell";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const clientId = "cmm0hcj6w000013wgcfyqalro";
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: { services: true, schedules: true }
        });

        if (!client || !client.retellAgentId) {
            return NextResponse.json({ error: "Client or agent not found" }, { status: 404 });
        }

        console.log("[retell/update-agent] Updating prompt for:", client.businessName);
        await updateRetellAgent(client.retellAgentId, {
            clientId: client.id,
            businessName: client.businessName || "Negocio",
            agentName: client.agentName || "Asistente",
            tone: client.agentTone || "profesional",
            services: client.services as any,
            schedules: client.schedules as any,
            webhookUrl: "https://api.citaliks.com"
        });

        return NextResponse.json({ success: true, message: "Agent prompt updated with current date" });
    } catch (err: any) {
        console.error("[retell/update-agent] error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
