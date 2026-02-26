import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    try {
        const client = await prisma.client.update({
            where: { clerkUserId: userId },
            data: { role: "PLATFORM_ADMIN" as any }
        });
        return NextResponse.json({ success: true, role: client.role, message: "Ahora eres PLATFORM_ADMIN" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
