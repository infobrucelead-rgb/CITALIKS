import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, getTenantPrisma } from "@/lib/db";
import { syncBotWithBusinessData } from "@/lib/bot-updates";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const targetPrisma = client.databaseUrl ? getTenantPrisma(client.databaseUrl) : prisma as any;

    try {
        const services = await targetPrisma.service.findMany({
            where: { clientId: client.id },
            include: { staff: true }
        });
        return NextResponse.json({ services });
    } finally {
        if (client.databaseUrl) await (targetPrisma as any).$disconnect();
    }
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const body = await req.json();
    const targetPrisma = client.databaseUrl ? getTenantPrisma(client.databaseUrl) : prisma as any;

    try {
        const service = await targetPrisma.service.create({
            data: {
                clientId: client.id,
                name: body.name,
                description: body.description,
                durationMin: parseInt(body.durationMin) || 30,
                price: parseFloat(body.price) || null,
                staffId: body.staffId || null,
            }
        });
        return NextResponse.json({ service });
    } finally {
        if (client.databaseUrl) await (targetPrisma as any).$disconnect();
    }
}

export async function PATCH(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const body = await req.json();
    const { id, ...data } = body;
    const targetPrisma = client.databaseUrl ? getTenantPrisma(client.databaseUrl) : prisma as any;

    try {
        const service = await targetPrisma.service.update({
            where: { id, clientId: client.id },
            data: {
                name: data.name,
                description: data.description,
                durationMin: data.durationMin ? parseInt(data.durationMin) : undefined,
                price: data.price !== undefined ? (data.price ? parseFloat(data.price) : null) : undefined,
                staffId: data.staffId,
                isActive: data.isActive
            }
        });

        // Trigger bot update
        await syncBotWithBusinessData(userId);

        return NextResponse.json({ service });
    } finally {
        if (client.databaseUrl) await (targetPrisma as any).$disconnect();
    }
}

export async function DELETE(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID faltante" }, { status: 400 });

    const targetPrisma = client.databaseUrl ? getTenantPrisma(client.databaseUrl) : prisma as any;

    try {
        await targetPrisma.service.delete({
            where: { id, clientId: client.id }
        });

        // Trigger bot update
        await syncBotWithBusinessData(userId);

        return NextResponse.json({ success: true });
    } finally {
        if (client.databaseUrl) await (targetPrisma as any).$disconnect();
    }
}
