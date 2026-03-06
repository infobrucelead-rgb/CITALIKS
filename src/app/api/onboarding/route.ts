import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, getTenantPrisma } from "@/lib/db";
import { syncBotWithBusinessData } from "@/lib/bot-updates";

// Save onboarding step data
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { step, data, token } = body as {
        step: number;
        data: Record<string, unknown>;
        token?: string;
    };

    // Upsert client record (create if first time)
    let client = await prisma.client.findUnique({ where: { clerkUserId: userId } });

    if (!client) {
        client = await prisma.client.create({
            data: {
                clerkUserId: userId,
                email: data.email as string ?? "",
                onboardingStep: step,
            },
        });
    }

    // Update fields based on step
    const updates: Record<string, unknown> = { onboardingStep: step };

    if (step === 1) {
        updates.businessName = data.businessName;
        updates.businessType = data.businessType;
        updates.city = data.city;
    }

    if (step === 2) {
        // Services: delete existing and recreate
        const targetPrisma = (client as any).databaseUrl ? getTenantPrisma((client as any).databaseUrl) : prisma;

        try {
            await targetPrisma.service.deleteMany({ where: { clientId: client.id } });
            if (Array.isArray(data.services) && data.services.length > 0) {
                await targetPrisma.service.createMany({
                    data: (data.services as Array<{
                        name: string;
                        durationMin: number;
                        price?: number;
                    }>).map((s) => ({
                        clientId: client!.id,
                        name: s.name,
                        durationMin: s.durationMin ?? 30,
                        price: s.price ?? null,
                    })),
                });
            }
        } finally {
            if ((client as any).databaseUrl) await (targetPrisma as any).$disconnect();
        }
    }

    if (step === 3) {
        // Schedules
        console.log(`[Onboarding] Saving schedules for client ${client.id}. Count: ${(data as any).schedules?.length}`);
        const targetPrisma = (client as any).databaseUrl ? getTenantPrisma((client as any).databaseUrl) : prisma;

        try {
            await targetPrisma.schedule.deleteMany({ where: { clientId: client.id } });
            if (Array.isArray(data.schedules)) {
                console.log(`[Onboarding] Creating ${data.schedules.length} schedules...`);
                await targetPrisma.schedule.createMany({
                    data: (data.schedules as Array<{
                        dayOfWeek: number;
                        openTime: string;
                        closeTime: string;
                        isOpen: boolean;
                    }>).map((s) => ({
                        clientId: client!.id,
                        dayOfWeek: s.dayOfWeek,
                        openTime: s.openTime,
                        closeTime: s.closeTime,
                        isOpen: s.isOpen,
                    })),
                });
                console.log(`[Onboarding] Schedules created successfully.`);
            }
        } catch (err) {
            console.error(`[Onboarding] Error saving schedules:`, err);
            throw err;
        } finally {
            if ((client as any).databaseUrl) await (targetPrisma as any).$disconnect();
        }
    }

    if (step === 4) {
        updates.agentName = data.agentName;
        updates.agentTone = data.agentTone;
        updates.agentVoice = data.agentVoice;
        updates.transferPhone = data.transferPhone;
    }

    await prisma.client.update({
        where: { id: client.id },
        data: updates,
    });

    if (token) {
        await (prisma as any).invitation.updateMany({
            where: { token, status: "PENDING" },
            data: { status: "ACCEPTED" }
        });
    }

    // Trigger bot update if agent is already provisioned
    await syncBotWithBusinessData(userId);

    const stepMessages: Record<number, string> = {
        2: "Tu asistente ha actualizado el servicio correctamente",
        3: "Tu asistente ha actualizado el horario correctamente"
    };

    return NextResponse.json({
        success: true,
        clientId: client.id,
        message: stepMessages[step]
    });
}

// Get current onboarding state
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const masterClient = await prisma.client.findUnique({
        where: { clerkUserId: userId },
    }) as any;

    if (!masterClient) return NextResponse.json({ client: null });

    let client = masterClient;
    if (masterClient.databaseUrl) {
        const tenantPrisma = getTenantPrisma(masterClient.databaseUrl);
        try {
            const tenantData = await tenantPrisma.client.findFirst({
                where: { clerkUserId: userId },
                include: {
                    services: true,
                    schedules: true,
                    staff: true,
                    callLogs: {
                        orderBy: { createdAt: "desc" },
                        take: 10
                    }
                } as any,
            });
            if (tenantData) {
                client = { ...masterClient, ...tenantData } as any;
            }
        } catch (err) {
            console.error("Error fetching from tenant DB during onboarding GET:", err);
        } finally {
            await tenantPrisma.$disconnect();
        }
    } else {
        const fullClient = await prisma.client.findUnique({
            where: { clerkUserId: userId },
            include: {
                services: true,
                schedules: true,
                staff: true,
                callLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 10
                }
            } as any,
        });
        if (fullClient) client = fullClient as any;
    }

    return NextResponse.json({ client });
}
