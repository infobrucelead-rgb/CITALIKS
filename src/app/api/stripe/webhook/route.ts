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
                    if (clientId) {
                        // Fetch full subscription details
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

                        // Send welcome/confirmation email
                        const client = await prisma.client.findUnique({ where: { id: clientId } });
                        if (client) {
                            await sendSubscriptionEmail(client, "activated", plan);
                        }

                        console.log(`[Stripe/Webhook] Subscription activated for client ${clientId}`);
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.citaliks.com";
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

// Export for use in cron
export { sendSubscriptionEmail };
