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
        const staff = await targetPrisma.staff.findMany({
            where: { clientId: client.id },
            include: { services: true, schedules: true }
        });
        return NextResponse.json({ staff });
    } finally {
        if (client.databaseUrl) await (targetPrisma as any).$disconnect();
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
        const staff = await targetPrisma.staff.create({
            data: {
                clientId: client.id,
                name: body.name,
                email: body.email || null,
                googleCalendarId: body.googleCalendarId || "primary",
            }
        });
        return NextResponse.json({ staff });
    } finally {
        if (client.databaseUrl) await (targetPrisma as any).$disconnect();
    }
}

export async function PATCH(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const body = await req.json();
    const { id, ...data } = body;
    const targetPrisma = (client as any).databaseUrl ? getTenantPrisma((client as any).databaseUrl) : prisma;

    try {
        const staff = await targetPrisma.staff.update({
            where: { id, clientId: client.id },
            data: {
                name: data.name,
                email: data.email,
                googleCalendarId: data.googleCalendarId,
                isActive: data.isActive
            }
        });
        return NextResponse.json({ staff });
    } finally {
        if (client.databaseUrl) await (targetPrisma as any).$disconnect();
    }
}

export async function DELETE(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID faltante" }, { status: 400 });

    const targetPrisma = (client as any).databaseUrl ? getTenantPrisma((client as any).databaseUrl) : prisma;

    try {
        await targetPrisma.staff.delete({
            where: { id, clientId: client.id }
        });

        // Trigger bot update
        await syncBotWithBusinessData(userId);

        return NextResponse.json({ success: true });
    } finally {
        if (client.databaseUrl) await (targetPrisma as any).$disconnect();
    }
}
