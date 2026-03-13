import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const admin = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
    if (!admin || admin.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { clientId, clientSecret, grantCode, region, businessId } = await req.json();

    if (!clientId || !clientSecret || !grantCode || !businessId) {
        return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    const accountsUrl = `https://accounts.zoho.${region || 'eu'}/oauth/v2/token`;

    try {
        const params = new URLSearchParams({
            code: grantCode,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
        });

        const res = await fetch(accountsUrl, {
            method: "POST",
            body: params
        });

        const data = await res.json();

        if (data.error) {
            return NextResponse.json({ error: data.error }, { status: 400 });
        }

        const updated = await prisma.client.update({
            where: { id: businessId },
            data: {
                crmProvider: "ZOHO",
                crmClientId: clientId,
                crmClientSecret: clientSecret,
                crmRefreshToken: data.refresh_token,
                crmActive: true
            }
        });

        return NextResponse.json({ success: true, client: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
