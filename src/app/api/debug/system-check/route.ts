import { NextRequest, NextResponse } from "next/server";
import { prisma, getTenantPrisma } from "@/lib/db";
import { retell } from "@/lib/retell";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");

    if (!clientId) {
        return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const report: any = {
        timestamp: new Date().toISOString(),
        clientId,
        masterDb: {},
        tenantDb: {},
        retellAgent: {}
    };

    try {
        // 1. Check Master DB
        const masterClient = await prisma.client.findUnique({
            where: { id: clientId },
            include: { services: true, schedules: true, staff: true }
        }) as any;

        if (!masterClient) {
            report.masterDb.status = "NOT_FOUND";
        } else {
            report.masterDb = {
                status: "OK",
                businessName: masterClient.businessName,
                hasAgent: !!masterClient.retellAgentId,
                agentId: masterClient.retellAgentId,
                hasDedicatedDb: !!masterClient.databaseUrl,
                models: {
                    client: !!prisma.client,
                    appointment: !!(prisma as any).appointment || !!(prisma as any).Appointment,
                    staff: !!prisma.staff,
                    service: !!prisma.service
                }
            };

            // 2. Check Retell Agent
            if (masterClient.retellAgentId) {
                try {
                    const agent = await retell.agent.retrieve(masterClient.retellAgentId);
                    const llm = await retell.llm.retrieve((agent as any).response_engine.llm_id);
                    report.retellAgent = {
                        status: "OK",
                        agentName: (agent as any).agent_name,
                        llmModel: (llm as any).model,
                        promptSnippet: (llm as any).general_prompt.substring(0, 100) + "...",
                        toolsFound: (llm as any).states?.[0]?.tools?.map((t: any) => t.name) || []
                    };
                } catch (err: any) {
                    report.retellAgent = { status: "ERROR", message: err.message };
                }
            }

            // 3. Check Tenant DB if applicable
            if (masterClient.databaseUrl) {
                try {
                    const tenantPrisma = getTenantPrisma(masterClient.databaseUrl);
                    const tenantClient = await tenantPrisma.client.findFirst({
                        where: { clerkUserId: masterClient.clerkUserId },
                        include: { services: true, schedules: true, staff: true }
                    });

                    report.tenantDb = {
                        status: "OK",
                        foundClient: !!tenantClient,
                        models: {
                            client: !!tenantPrisma.client,
                            appointment: !!tenantPrisma.appointment || !!tenantPrisma.Appointment,
                            staff: !!tenantPrisma.staff,
                            service: !!tenantPrisma.service
                        },
                        servicesCount: tenantClient?.services?.length || 0,
                        schedulesCount: tenantClient?.schedules?.length || 0
                    };
                    await tenantPrisma.$disconnect();
                } catch (err: any) {
                    report.tenantDb = { status: "ERROR", message: err.message };
                }
            }
        }

        return NextResponse.json(report);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
