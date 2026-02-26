import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { createBillingPortalSession } from "@/lib/stripe";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session so the client can manage their billing,
 * update payment methods, download invoices, or cancel their subscription.
 */
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { targetClientId } = body;

    try {
        let client: any;

        if (targetClientId) {
            // Admin accessing portal for a client
            const admin = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
            if (!admin || admin.role !== "PLATFORM_ADMIN") {
                return NextResponse.json({ error: "No autorizado" }, { status: 403 });
            }
            client = await prisma.client.findUnique({ where: { id: targetClientId } });
        } else {
            client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
        }

        if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
        if (!client.stripeCustomerId) {
            return NextResponse.json({ error: "Este cliente no tiene una suscripción activa en Stripe" }, { status: 400 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.citaliks.com";
        const portalUrl = await createBillingPortalSession({
            customerId: client.stripeCustomerId,
            returnUrl: `${appUrl}/dashboard`,
        });

        return NextResponse.json({ success: true, url: portalUrl });
    } catch (error: any) {
        console.error("[Stripe/Portal] Error:", error);
        return NextResponse.json({ error: error.message || "Error al abrir el portal de facturación" }, { status: 500 });
    }
}
