import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getOrCreateStripeCustomer, createCheckoutSession, getPriceId } from "@/lib/stripe";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for a client subscription.
 * Can be called by:
 *   - The client themselves (from their dashboard)
 *   - A PLATFORM_ADMIN on behalf of a client (passing clientId in body)
 */
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const { plan, targetClientId } = body; // targetClientId only for admin use

    if (!plan || !["monthly", "biannual", "annual"].includes(plan)) {
        return NextResponse.json({ error: "Plan inválido. Usa: monthly, biannual, annual" }, { status: 400 });
    }

    try {
        // Determine which client we're creating the subscription for
        let client: any;

        if (targetClientId) {
            // Admin creating subscription for another client
            const admin = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
            if (!admin || admin.role !== "PLATFORM_ADMIN") {
                return NextResponse.json({ error: "No autorizado" }, { status: 403 });
            }
            client = await prisma.client.findUnique({ where: { id: targetClientId } });
        } else {
            // Client creating their own subscription
            client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
        }

        if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

        // Get or create Stripe customer
        const stripeCustomerId = await getOrCreateStripeCustomer({
            clientId: client.id,
            email: client.email,
            businessName: client.businessName || client.email,
            existingCustomerId: client.stripeCustomerId,
        });

        // Save stripeCustomerId if new
        if (stripeCustomerId !== client.stripeCustomerId) {
            await prisma.client.update({
                where: { id: client.id },
                data: { stripeCustomerId }
            });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.citaliks.com";
        const priceId = getPriceId(plan);

        const checkoutUrl = await createCheckoutSession({
            customerId: stripeCustomerId,
            priceId,
            plan,
            clientId: client.id,
            successUrl: `${appUrl}/dashboard?subscription=success&plan=${plan}`,
            cancelUrl: `${appUrl}/dashboard?subscription=cancelled`,
        });

        return NextResponse.json({ success: true, url: checkoutUrl });
    } catch (error: any) {
        console.error("[Stripe/Checkout] Error:", error);
        return NextResponse.json({ error: error.message || "Error al crear sesión de pago" }, { status: 500 });
    }
}
