import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { createCheckoutSession, getPriceId } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/admin/send-payment-link
 * 1. Registers/updates a Prospect
 * 2. Generates a Stripe Checkout session
 * 3. Sends an email with the link and "contract" (simulated)
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
  if (!admin || admin.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { email, name, phone, plan, notes } = await req.json();

  if (!email || !name || !plan) {
    return NextResponse.json({ error: "Faltan campos obligatorios (email, nombre, plan)" }, { status: 400 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.citaliks.com";
    const priceId = getPriceId(plan);

    // Setup fee ONLY for monthly plan as per rules
    const setupPriceId = plan === "monthly" ? process.env.STRIPE_PRICE_SETUP : undefined;

    // 1. Create Checkout Session for the Prospect
    const checkoutUrl = await createCheckoutSession({
      priceId,
      plan,
      customerEmail: email,
      setupPriceId: setupPriceId || undefined,
      successUrl: `${appUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/pricing`,
      metadata: {
        prospect_email: email,
        prospect_name: name,
        plan,
      }
    });

    // 2. Upsert Prospect in DB
    const prospect = await prisma.prospect.upsert({
      where: { email },
      update: {
        name,
        plan,
        notes,
        status: "pending",
        paymentLinkSentAt: new Date(),
        paymentLinkSentBy: userId,
      },
      create: {
        email,
        name,
        plan,
        notes,
        status: "pending",
        paymentLinkSentAt: new Date(),
        paymentLinkSentBy: userId,
      }
    });

    // 3. Send Email with Link and Contract
    await sendEmail({
      to: email,
      subject: `Propuesta Comercial y Enlace de Pago — CitaLiks para ${name}`,
      html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="cid:logo" alt="CitaLiks" style="max-width: 150px;" />
                    </div>
                    <h2 style="color: #2563eb;">¡Hola ${name}!</h2>
                    <p>Es un placer saludarte. Tal como acordamos, aquí tienes el enlace para activar tu asistente de voz con el plan <strong>${plan}</strong>.</p>
                    
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                        <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #6b7280;">Resumen del Acuerdo</h3>
                        <ul style="font-size: 14px; color: #374151;">
                            <li><strong>Asistente:</strong> Sofía (IA avanzada)</li>
                            <li><strong>Plan:</strong> ${plan}</li>
                            <li><strong>Soporte:</strong> Priority Support incluido</li>
                            <li><strong>Setup:</strong> ${plan === 'monthly' ? '899€ (Pago único inicial)' : 'Incluido en el plan'}</li>
                        </ul>
                    </div>

                    <p>Puedes completar la contratación y el pago de forma segura pulsando el siguiente botón:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${checkoutUrl}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Completar Pago y Alta</a>
                    </div>

                    <p style="font-size: 12px; color: #6b7280;">Al realizar el pago, aceptas nuestras condiciones de servicio. Una vez completado, recibirás automáticamente las instrucciones de acceso para configurar tu negocio.</p>
                </div>
            `
    });

    return NextResponse.json({ success: true, url: checkoutUrl });
  } catch (error: any) {
    console.error("[Admin/SendPayment] Error:", error);
    return NextResponse.json({ error: error.message || "Error al procesar el envío" }, { status: 500 });
  }
}

/**
 * GET /api/admin/send-payment-link
 * Lists all prospects for the "Leads" tab
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = await prisma.client.findUnique({ where: { clerkUserId: userId } }) as any;
  if (!admin || admin.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const prospects = await prisma.prospect.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ prospects });
}
