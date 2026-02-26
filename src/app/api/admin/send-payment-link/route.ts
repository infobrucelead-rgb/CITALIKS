import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma as db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/admin/send-payment-link
 * Sends a Stripe checkout link to a prospect's email.
 * Admin only.
 *
 * Body: { email, name, plan: "monthly" | "biannual" | "annual", notes? }
 */
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin
    const user = await db.client.findUnique({ where: { clerkUserId: userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "PLATFORM_ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, plan = "biannual", notes } = body;

    if (!email || !name) {
        return NextResponse.json({ error: "email y name son obligatorios" }, { status: 400 });
    }

    const planLabels: Record<string, string> = {
        monthly: "Mensual",
        biannual: "Semestral",
        annual: "Anual",
    };

    const planPrices: Record<string, string> = {
        monthly: process.env.STRIPE_PRICE_MONTHLY || "",
        biannual: process.env.STRIPE_PRICE_BIANNUAL || "",
        annual: process.env.STRIPE_PRICE_ANNUAL || "",
    };

    const priceId = planPrices[plan];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.citaliks.com";

    // Build checkout URL — we use a special onboarding flow after payment
    // The prospect doesn't have a Clerk account yet, so we use Stripe's hosted checkout
    // and create the account after payment via webhook
    let checkoutUrl: string;

    if (priceId && process.env.STRIPE_SECRET_KEY) {
        try {
            const { getStripe } = await import("@/lib/stripe");
            const stripe = getStripe();

            const session = await stripe.checkout.sessions.create({
                mode: "subscription",
                payment_method_types: ["card"],
                customer_email: email,
                line_items: [{ price: priceId, quantity: 1 }],
                success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`,
                cancel_url: `${appUrl}/demo`,
                metadata: {
                    prospect_email: email,
                    prospect_name: name,
                    plan,
                    notes: notes || "",
                    source: "admin_manual",
                },
                subscription_data: {
                    metadata: {
                        prospect_email: email,
                        prospect_name: name,
                        plan,
                    },
                },
            });

            checkoutUrl = session.url!;
        } catch (err: any) {
            console.error("[SendPaymentLink] Stripe error:", err);
            // Fallback: send a generic payment page link
            checkoutUrl = `${appUrl}/checkout?email=${encodeURIComponent(email)}&plan=${plan}`;
        }
    } else {
        // Stripe not configured — send a placeholder link
        checkoutUrl = `${appUrl}/checkout?email=${encodeURIComponent(email)}&plan=${plan}`;
    }

    // Save prospect to DB for tracking
    await db.prospect.upsert({
        where: { email },
        update: {
            name,
            plan,
            notes: notes || null,
            paymentLinkSentAt: new Date(),
            paymentLinkSentBy: user.id,
        },
        create: {
            email,
            name,
            plan,
            notes: notes || null,
            paymentLinkSentAt: new Date(),
            paymentLinkSentBy: user.id,
        },
    });

    // Send email to prospect
    await sendEmail({
        to: email,
        subject: `${name}, aquí tienes tu enlace de acceso a CitaLiks`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <div style="width:36px;height:36px;background:#7c3aed;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">C</div>
        <span style="font-size:22px;font-weight:800;color:white;">Cita<span style="color:#a78bfa;">Liks</span></span>
      </div>
    </div>

    <!-- Card -->
    <div style="background:#111118;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;">
      <h1 style="color:white;font-size:24px;font-weight:800;margin:0 0 8px;">Hola, ${name} 👋</h1>
      <p style="color:rgba(255,255,255,0.5);font-size:15px;line-height:1.6;margin:0 0 24px;">
        Has visto cómo funciona CitaLiks y estás listo para tener tu propio asistente de voz con IA.
        Solo queda un paso: completar el pago para activar tu cuenta.
      </p>

      <!-- Plan badge -->
      <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:12px;padding:16px;margin-bottom:28px;">
        <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Plan seleccionado</p>
        <p style="color:#a78bfa;font-size:20px;font-weight:800;margin:0;">${planLabels[plan] || plan}</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${checkoutUrl}" 
           style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:16px 40px;border-radius:16px;font-weight:700;font-size:16px;">
          Completar el pago →
        </a>
      </div>

      <p style="color:rgba(255,255,255,0.3);font-size:13px;text-align:center;margin:0 0 24px;">
        Pago seguro con Stripe · Cancela cuando quieras
      </p>

      <!-- What happens next -->
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
        <p style="color:rgba(255,255,255,0.4);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">¿Qué pasa después del pago?</p>
        <div style="space-y:8px;">
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <span style="color:#a78bfa;font-size:16px;">1.</span>
            <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">Recibirás un email con el enlace de acceso a tu panel</p>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <span style="color:#a78bfa;font-size:16px;">2.</span>
            <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">Configuras tu negocio en 5 minutos (nombre, servicios, horarios)</p>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="color:#a78bfa;font-size:16px;">3.</span>
            <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">Tu asistente de voz empieza a atender llamadas</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <p style="color:rgba(255,255,255,0.2);font-size:12px;text-align:center;margin-top:24px;">
      CitaLiks · Si tienes alguna duda, responde a este email<br>
      <a href="${appUrl}/demo" style="color:rgba(124,58,237,0.7);">Ver la demo de nuevo</a>
    </p>
  </div>
</body>
</html>`,
    });

    return NextResponse.json({
        success: true,
        message: `Enlace de pago enviado a ${email}`,
        checkoutUrl,
    });
}

/**
 * GET /api/admin/send-payment-link
 * Returns the list of prospects with their payment status.
 */
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.client.findUnique({ where: { clerkUserId: userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "PLATFORM_ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prospects = await db.prospect.findMany({
        orderBy: { paymentLinkSentAt: "desc" },
        take: 100,
    });

    return NextResponse.json({ prospects });
}
