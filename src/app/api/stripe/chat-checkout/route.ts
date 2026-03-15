import { NextResponse } from 'next/server';
import { getPlanById } from '@/config/pricing';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { planId } = await req.json();
    if (!planId) return NextResponse.json({ error: "El plan es obligatorio" }, { status: 400 });

    const plan = getPlanById(planId);
    if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    
    // Validar que el entorno tenga los IDs bien puestos
    if (!plan.stripePriceId) {
      console.error(`Falta el ID recurrente para el plan ${planId} en las variables de entorno.`);
      return NextResponse.json({ error: "El plan seleccionado aún no está configurado para cobros." }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.citaliks.com";

    const sessionUrl = await createCheckoutSession({
      priceId: plan.stripePriceId,
      setupPriceId: plan.stripeSetupId, // Se omite automáticamente si es undefined (ej. matrícula gratis)
      plan: plan.id,
      trialDays: 20, // 20 días de prueba gratuita fijos para chat
      successUrl: `${appUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/`, 
      metadata: {
        source: 'chat_widget',
        commitment_months: plan.commitmentMonths.toString(),
      }
    });

    return NextResponse.json({ url: sessionUrl });
  } catch (error: any) {
    console.error("[Stripe Chat Checkout Error]:", error);
    return NextResponse.json({ error: error.message || "Error al crear la sesión de pago." }, { status: 500 });
  }
}
