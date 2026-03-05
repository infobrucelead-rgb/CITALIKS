import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, getTenantPrisma } from "@/lib/db";
import { syncBotWithBusinessData } from "@/lib/bot-updates";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const targetPrisma = (client as any).databaseUrl ? getTenantPrisma((client as any).databaseUrl) : prisma;

    try {
        const schedules = await targetPrisma.schedule.findMany({
            where: { clientId: client.id },
            include: { staff: true }
        });
        return NextResponse.json({ schedules });
    } finally {
        if ((client as any).databaseUrl) await (targetPrisma as any).$disconnect();
    }
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const body = await req.json();
    const targetPrisma = (client as any).databaseUrl ? getTenantPrisma((client as any).databaseUrl) : prisma;

    try {
        // Use a transaction to ensure atomicity
        const result = await (targetPrisma as any).$transaction(async (tx: any) => {
            // Delete any existing schedule for this specific criteria
            await tx.schedule.deleteMany({
                where: {
                    clientId: client.id,
                    staffId: body.staffId || null,
                    dayOfWeek: body.dayOfWeek
                }
            });

            // Create the new one
            return await tx.schedule.create({
                data: {
                    clientId: client.id,
                    staffId: body.staffId || null,
                    dayOfWeek: body.dayOfWeek,
                    openTime: body.openTime,
                    closeTime: body.closeTime,
                    isOpen: body.isOpen
                }
            });
        });

        // Trigger bot update
        await syncBotWithBusinessData(userId);

        return NextResponse.json({
            schedule: result,
            message: "Tu asistente ha actualizado el horario correctamente"
        });
    } catch (err: any) {
        console.error("[Schedules API] Error saving schedule:", err.message);
        return NextResponse.json({ error: "Error al guardar el horario" }, { status: 500 });
    } finally {
        if ((client as any).databaseUrl) await (targetPrisma as any).$disconnect();
    }
}

