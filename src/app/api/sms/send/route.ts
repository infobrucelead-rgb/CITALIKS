/**
 * Manual SMS Send Endpoint
 * POST /api/sms/send
 *
 * For testing and manual SMS sending from the dashboard.
 * Requires PLATFORM_ADMIN authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
    // ─── Auth: Requires authenticated PLATFORM_ADMIN ───────────────────────────
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const adminClient = await prisma.client.findUnique({
        where: { clerkUserId: userId },
        select: { role: true },
    }) as any;

    if (!adminClient || adminClient.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    // ───────────────────────────────────────────────────────────────────────────

    try {
        const body = await req.json();
        const { to, message, from } = body as {
            to: string;
            message: string;
            from?: string;
        };

        if (!to || !message) {
            return NextResponse.json(
                { error: "Se requieren los campos 'to' y 'message'" },
                { status: 400 }
            );
        }

        const result = await sendSms(to, message, from);

        return NextResponse.json(result, { status: result.success ? 200 : 500 });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || "Error desconocido" },
            { status: 500 }
        );
    }
}
