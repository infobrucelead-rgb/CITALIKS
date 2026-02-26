import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// ── GET: List appointments (all or by clientId) ────────────────────────────
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const admin = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
    if (!admin || admin.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    try {
        const where: any = {};
        if (clientId) where.clientId = clientId;

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                client: { select: { businessName: true, email: true } }
            },
            orderBy: [{ date: "desc" }, { time: "desc" }],
            take: 200
        });

        return NextResponse.json({ success: true, appointments });
    } catch (error: any) {
        console.error("[Admin/Appointments] GET error:", error);
        return NextResponse.json({ error: "Error al obtener citas", message: error.message }, { status: 500 });
    }
}

// ── PATCH: Update appointment status ──────────────────────────────────────
export async function PATCH(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const admin = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
    if (!admin || admin.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { appointmentId, status, notes } = await req.json();
    if (!appointmentId) return NextResponse.json({ error: "appointmentId requerido" }, { status: 400 });

    try {
        const updateData: any = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: updateData
        });

        console.log(`[Admin/Appointments] Appointment ${appointmentId} updated: ${JSON.stringify(updateData)} by admin ${userId}`);

        return NextResponse.json({ success: true, appointment: updated });
    } catch (error: any) {
        console.error("[Admin/Appointments] PATCH error:", error);
        return NextResponse.json({ error: "Error al actualizar cita", message: error.message }, { status: 500 });
    }
}

// ── DELETE: Hard delete an appointment ────────────────────────────────────
export async function DELETE(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const admin = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
    if (!admin || admin.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { appointmentId } = await req.json();
    if (!appointmentId) return NextResponse.json({ error: "appointmentId requerido" }, { status: 400 });

    try {
        await prisma.appointment.delete({ where: { id: appointmentId } });
        console.log(`[Admin/Appointments] Appointment ${appointmentId} deleted by admin ${userId}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Admin/Appointments] DELETE error:", error);
        return NextResponse.json({ error: "Error al eliminar cita", message: error.message }, { status: 500 });
    }
}
