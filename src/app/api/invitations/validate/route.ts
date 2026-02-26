import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) return NextResponse.json({ error: "Token faltante" }, { status: 400 });

    const invitation = await prisma.invitation.findUnique({
        where: { token }
    });

    if (!invitation) return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });

    return NextResponse.json({ invitation });
}
