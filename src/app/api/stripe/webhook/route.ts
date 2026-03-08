import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { constructWebhookEvent, extractSubscriptionData } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events to keep subscription state in sync.
 *
 * Events handled:
 *   - checkout.session.completed       → subscription activated
 *   - customer.subscription.updated    → status change (active, past_due, etc.)
 *   - customer.subscription.deleted    → subscription cancelled
 *   - invoice.payment_succeeded        → payment confirmed, update lastPaymentAt
 *   - invoice.payment_failed           → payment failed, suspend client
 */
export async function POST(req: NextRequest) {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = constructWebhookEvent(payload, signature);
    } catch (err: any) {
        console.error("[Stripe/Webhook] Signature verification failed:", err.message);
        return NextResponse.json({ error: `Webhook signature error: ${err.message}` }, { status: 400 });
    }

    console.log(`[Stripe/Webhook] Event received: ${event.type}`);

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === "subscription" && session.subscription) {
                    const clientId = session.metadata?.citaliks_client_id;
                    const plan = session.metadata?.plan || "monthly";
                    const prospectEmail = session.metadata?.prospect_email || session.customer_email;
                    const prospectName = session.metadata?.prospect_name;

                    if (clientId) {
                        // Existing client renewing or upgrading
                        const { getStripe } = await import("@/lib/stripe");
                        const subscription = await getStripe().subscriptions.retrieve(session.subscription as string);
                        const subData = extractSubscriptionData(subscription);

                        await prisma.client.update({
                            where: { id: clientId },
                            data: {
                                stripeCustomerId: session.customer as string,
                                stripeSubscriptionId: subData.stripeSubscriptionId,
                                stripePriceId: subData.stripePriceId,
                                subscriptionPlan: plan,
                                subscriptionStatus: "active",
                                subscriptionStart: subData.subscriptionStart,
                                subscriptionEnd: subData.subscriptionEnd,
                                trialEnd: subData.trialEnd,
                                lastPaymentAt: new Date(),
                                isActive: true,
                                renewalReminderSent: false,
                                renewalReminderSentAt: null,
                            }
                        });

                        const client = await prisma.client.findUnique({ where: { id: clientId } });
                        if (client) await sendSubscriptionEmail(client, "activated", plan);
                        console.log(`[Stripe/Webhook] Subscription activated for existing client ${clientId}`);

                    } else if (prospectEmail) {
                        // NEW prospect — send onboarding email
                        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.citaliks.com";

                        // Update prospect status in DB
                        await prisma.prospect.upsert({
                            where: { email: prospectEmail },
                            update: {
                                status: "paid",
                                paidAt: new Date(),
                                stripeSessionId: session.id,
                                onboardingLinkSentAt: new Date(),
                            },
                            create: {
                                email: prospectEmail,
                                name: prospectName || prospectEmail,
                                plan,
                                status: "paid",
                                paidAt: new Date(),
                                stripeSessionId: session.id,
                                onboardingLinkSentAt: new Date(),
                            },
                        });

                        // Send onboarding email with sign-up link
                        const signUpUrl = `${appUrl}/sign-up?email=${encodeURIComponent(prospectEmail)}`;
                        await sendOnboardingEmail({
                            email: prospectEmail,
                            name: prospectName || "Hola",
                            plan,
                            signUpUrl,
                            appUrl,
                        });

                        // NOTIFY ADMIN
                        await sendAdminNotification({
                            email: prospectEmail,
                            name: prospectName || prospectEmail,
                            plan,
                            appUrl
                        });

                        console.log(`[Stripe/Webhook] Onboarding email and Admin alert sent for ${prospectEmail}`);
                    }
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const clientId = subscription.metadata?.citaliks_client_id;
                if (!clientId) break;

                const subData = extractSubscriptionData(subscription);
                const wasActive = (event.data.previous_attributes as any)?.status === "active";
                const isPastDue = subData.subscriptionStatus === "past_due";

                await prisma.client.update({
                    where: { id: clientId },
                    data: {
                        subscriptionStatus: subData.subscriptionStatus,
                        subscriptionEnd: subData.subscriptionEnd,
                        stripePriceId: subData.stripePriceId,
                        // Suspend client if past_due
                        ...(isPastDue ? { isActive: false } : {}),
                        // Reactivate if coming back to active
                        ...(subData.subscriptionStatus === "active" && !wasActive ? {
                            isActive: true,
                            renewalReminderSent: false,
                            renewalReminderSentAt: null,
                        } : {}),
                    }
                });

                if (isPastDue) {
                    const client = await prisma.client.findUnique({ where: { id: clientId } });
                    if (client) await sendSubscriptionEmail(client, "past_due");
                }

                console.log(`[Stripe/Webhook] Subscription updated for client ${clientId}: ${subData.subscriptionStatus}`);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const clientId = subscription.metadata?.citaliks_client_id;
                if (!clientId) break;

                await prisma.client.update({
                    where: { id: clientId },
                    data: {
                        subscriptionStatus: "canceled",
                        isActive: false,
                        stripeSubscriptionId: null,
                    }
                });

                const client = await prisma.client.findUnique({ where: { id: clientId } });
                if (client) await sendSubscriptionEmail(client, "canceled");

                console.log(`[Stripe/Webhook] Subscription canceled for client ${clientId}`);
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;
                if (!customerId) break;

                await prisma.client.updateMany({
                    where: { stripeCustomerId: customerId },
                    data: {
                        lastPaymentAt: new Date(),
                        subscriptionStatus: "active",
                        isActive: true,
                        renewalReminderSent: false,
                        renewalReminderSentAt: null,
                    }
                });

                console.log(`[Stripe/Webhook] Payment succeeded for customer ${customerId}`);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;
                if (!customerId) break;

                const client = await prisma.client.findFirst({
                    where: { stripeCustomerId: customerId }
                });

                if (client) {
                    await prisma.client.update({
                        where: { id: client.id },
                        data: {
                            subscriptionStatus: "past_due",
                            isActive: false,
                        }
                    });
                    await sendSubscriptionEmail(client, "payment_failed");
                }

                console.log(`[Stripe/Webhook] Payment failed for customer ${customerId}`);
                break;
            }

            default:
                console.log(`[Stripe/Webhook] Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("[Stripe/Webhook] Processing error:", error);
        return NextResponse.json({ error: "Webhook processing failed", message: error.message }, { status: 500 });
    }
}

// ── Email templates ───────────────────────────────────────────────────────────

async function sendSubscriptionEmail(client: any, type: "activated" | "past_due" | "canceled" | "payment_failed" | "renewal_reminder", plan?: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.citaliks.com";
    const businessName = client.businessName || "tu negocio";

    const templates: Record<string, { subject: string; html: string }> = {
        activated: {
            subject: `✅ Suscripción activada — ${businessName}`,
            html: emailTemplate({
                title: "¡Suscripción activada!",
                body: `Tu suscripción para <strong>${businessName}</strong> está activa. Tu asistente de voz ya está operativo y listo para gestionar citas.`,
                cta: { label: "Ir a mi Panel", url: `${appUrl}/dashboard` },
                color: "#10b981",
            })
        },
        past_due: {
            subject: `⚠️ Pago pendiente — Servicio pausado temporalmente`,
            html: emailTemplate({
                title: "Tu servicio ha sido pausado",
                body: `Hemos detectado un problema con el pago de tu suscripción para <strong>${businessName}</strong>. Tu asistente de voz ha sido pausado temporalmente. Actualiza tu método de pago para reactivarlo.`,
                cta: { label: "Actualizar Pago", url: `${appUrl}/api/stripe/portal` },
                color: "#f59e0b",
            })
        },
        canceled: {
            subject: `❌ Suscripción cancelada — ${businessName}`,
            html: emailTemplate({
                title: "Suscripción cancelada",
                body: `Tu suscripción para <strong>${businessName}</strong> ha sido cancelada. Tu asistente de voz ya no está activo. Si deseas reactivar el servicio, puedes contratar un nuevo plan.`,
                cta: { label: "Renovar Suscripción", url: `${appUrl}/dashboard` },
                color: "#ef4444",
            })
        },
        payment_failed: {
            subject: `🚨 Fallo en el pago — Acción requerida`,
            html: emailTemplate({
                title: "No hemos podido procesar tu pago",
                body: `El cobro de tu suscripción para <strong>${businessName}</strong> ha fallado. Tu asistente de voz ha sido pausado. Por favor, actualiza tu método de pago lo antes posible para evitar interrupciones en el servicio.`,
                cta: { label: "Actualizar Método de Pago", url: `${appUrl}/api/stripe/portal` },
                color: "#ef4444",
            })
        },
        renewal_reminder: {
            subject: `🔔 Tu suscripción vence pronto — ${businessName}`,
            html: emailTemplate({
                title: "Tu suscripción vence en 7 días",
                body: `La suscripción de <strong>${businessName}</strong> vence el próximo <strong>${client.subscriptionEnd ? new Date(client.subscriptionEnd).toLocaleDateString("es-ES") : "pronto"}</strong>. Se renovará automáticamente si tienes un método de pago válido. Si tienes algún problema, accede a tu portal de facturación.`,
                cta: { label: "Gestionar Suscripción", url: `${appUrl}/dashboard` },
                color: "#3b82f6",
            })
        },
    };

    const template = templates[type];
    if (!template) return;

    await sendEmail({
        to: client.email,
        subject: template.subject,
        html: template.html,
    });
}

function emailTemplate({ title, body, cta, color }: { title: string; body: string; cta: { label: string; url: string }; color: string }): string {
    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; background: #0a0a0f; padding: 12px 24px; border-radius: 12px;">
                <span style="color: white; font-weight: 900; font-size: 20px; letter-spacing: -0.025em;">Cita<span style="color: ${color};">Liks</span></span>
            </div>
        </div>
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
            <div style="width: 48px; height: 4px; background: ${color}; border-radius: 2px; margin-bottom: 24px;"></div>
            <h1 style="color: #111827; margin: 0 0 16px; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${title}</h1>
            <p style="color: #4b5563; line-height: 1.7; font-size: 15px; margin: 0 0 32px;">${body}</p>
            <div style="text-align: center;">
                <a href="${cta.url}" style="display: inline-block; background: ${color}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px;">${cta.label}</a>
            </div>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">© 2026 CitaLiks · Gestión Inteligente de Citas</p>
    </div>`;
}

// Export removed because Next.js route files can only export HTTP method functions.

// ── Onboarding email for new prospects ───────────────────────────────────────

async function sendOnboardingEmail({ email, name, plan, signUpUrl, appUrl }: {
    email: string;
    name: string;
    plan: string;
    signUpUrl: string;
    appUrl: string;
}) {
    const planLabels: Record<string, string> = {
        monthly: "Mensual",
        biannual: "Semestral",
        annual: "Anual",
    };

    await sendEmail({
        to: email,
        subject: `${name}, ¡tu pago ha sido confirmado! Aquí tienes tu acceso a CitaLiks`,
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
      
      <!-- Success badge -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:100px;padding:8px 20px;">
          <span style="color:#10b981;font-size:16px;">✓</span>
          <span style="color:#10b981;font-size:13px;font-weight:700;">Pago confirmado</span>
        </div>
      </div>

      <h1 style="color:white;font-size:26px;font-weight:800;margin:0 0 12px;text-align:center;">¡Bienvenido a CitaLiks, ${name}!</h1>
      <p style="color:rgba(255,255,255,0.5);font-size:15px;line-height:1.6;margin:0 0 28px;text-align:center;">
        Tu suscripción <strong style="color:white;">${planLabels[plan] || plan}</strong> está activa.
        Ahora solo tienes que crear tu cuenta y configurar tu asistente.
      </p>

      <!-- Steps -->
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px;margin-bottom:28px;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Qué pasa ahora</p>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:24px;height:24px;background:#7c3aed;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;flex-shrink:0;">1</div>
            <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;line-height:1.5;">Haz clic en el botón de abajo para crear tu cuenta</p>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:24px;height:24px;background:#7c3aed;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;flex-shrink:0;">2</div>
            <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;line-height:1.5;">Completa el onboarding: nombre del negocio, servicios y horarios (5 minutos)</p>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:24px;height:24px;background:#7c3aed;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;flex-shrink:0;">3</div>
            <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;line-height:1.5;">Tu asistente de voz estará activo y listo para atender llamadas</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${signUpUrl}" 
           style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:18px 48px;border-radius:16px;font-weight:700;font-size:16px;">
          Crear mi cuenta →
        </a>
      </div>

      <p style="color:rgba(255,255,255,0.2);font-size:12px;text-align:center;margin-top:20px;">
        Este enlace es personal. No lo compartas.
      </p>
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
}

async function sendAdminNotification({ email, name, plan, appUrl }: {
    email: string;
    name: string;
    plan: string;
    appUrl: string;
}) {
    const adminEmail = "neuralads.mkt@gmail.com";
    const planLabels: Record<string, string> = {
        monthly: "Mensual",
        biannual: "Semestral",
        annual: "Anual",
    };

    await sendEmail({
        to: adminEmail,
        subject: `🚨 ¡NUEVO PAGO RECIBIDO! — ${name} (${planLabels[plan] || plan})`,
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #f0fdf4;">
            <h2 style="color: #166534; font-size: 20px;">💰 ¡Enhorabuena Pablo! Nuevo cliente en CitaLiks</h2>
            <p style="color: #374151; line-height: 1.6;">El lead <strong>${name}</strong> ha completado el pago de su suscripción y ya ha recibido las instrucciones de onboarding.</p>
            
            <div style="background-color: white; border: 1px solid #dcfce7; padding: 20px; border-radius: 10px; margin: 25px 0;">
                <p style="margin: 5px 0; color: #111827;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0; color: #111827;"><strong>Plan contratado:</strong> ${planLabels[plan] || plan}</p>
                <p style="margin: 5px 0; color: #111827;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
            </div>

            <p style="color: #374151; line-height: 1.6;">Es un buen momento para llamar al cliente, darle la bienvenida y asistirle en los pasos iniciales si fuera necesario.</p>
            
            <div style="text-align: center; margin: 20px 0;">
                <a href="${appUrl}/dashboard/admin" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver en Dashboard de Admin</a>
            </div>
        </div>`
    });
}
