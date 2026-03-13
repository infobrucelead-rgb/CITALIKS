import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/stripe/subscription-cron
 * Daily cron job that:
 *   1. Sends renewal reminder emails 7 days before subscription expires
 *   2. Suspends clients whose subscription has expired (no payment received)
 *   3. Sends suspension notification email
 *
 * Protected by CRON_SECRET header.
 * Configure in vercel.json or GitHub Actions to run daily at 09:00.
 */
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.citaliks.com";

    const results = {
        reminders_sent: 0,
        suspended: 0,
        errors: [] as string[],
    };

    try {
        // ── 1. Send renewal reminders (7 days before expiry) ─────────────────
        const expiringClients = await prisma.client.findMany({
            where: {
                subscriptionStatus: "active",
                isActive: true,
                renewalReminderSent: false,
                subscriptionEnd: {
                    gte: now,
                    lte: in7Days,
                }
            }
        });

        for (const client of expiringClients) {
            try {
                const expiryDate = client.subscriptionEnd
                    ? new Date(client.subscriptionEnd).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
                    : "próximamente";

                await sendEmail({
                    to: client.email,
                    subject: `🔔 Tu suscripción de CitaLiks vence el ${expiryDate}`,
                    html: renewalReminderEmail({
                        businessName: client.businessName || "tu negocio",
                        expiryDate,
                        portalUrl: `${appUrl}/dashboard`,
                    })
                });

                await prisma.client.update({
                    where: { id: client.id },
                    data: {
                        renewalReminderSent: true,
                        renewalReminderSentAt: now,
                    }
                });

                results.reminders_sent++;
                console.log(`[SubscriptionCron] Renewal reminder sent to ${client.email} (expires ${expiryDate})`);
            } catch (err: any) {
                results.errors.push(`Reminder for ${client.email}: ${err.message}`);
                console.error(`[SubscriptionCron] Error sending reminder to ${client.email}:`, err);
            }
        }

        // ── 2. Suspend expired clients ────────────────────────────────────────
        // Only suspend clients whose subscription ended AND status is still "active"
        // (Stripe webhook should handle this, but this is a safety net)
        const expiredClients = await prisma.client.findMany({
            where: {
                subscriptionStatus: "active",
                isActive: true,
                subscriptionEnd: {
                    lt: now,
                }
            }
        });

        for (const client of expiredClients) {
            try {
                await prisma.client.update({
                    where: { id: client.id },
                    data: {
                        isActive: false,
                        subscriptionStatus: "canceled",
                    }
                });

                await sendEmail({
                    to: client.email,
                    subject: `⏸️ Servicio pausado — Tu suscripción de CitaLiks ha expirado`,
                    html: suspensionEmail({
                        businessName: client.businessName || "tu negocio",
                        renewUrl: `${appUrl}/dashboard`,
                    })
                });

                results.suspended++;
                console.log(`[SubscriptionCron] Client ${client.id} (${client.email}) suspended — subscription expired`);
            } catch (err: any) {
                results.errors.push(`Suspension for ${client.email}: ${err.message}`);
                console.error(`[SubscriptionCron] Error suspending ${client.email}:`, err);
            }
        }

        // ── 3. Log summary ────────────────────────────────────────────────────
        console.log(`[SubscriptionCron] Done. Reminders: ${results.reminders_sent}, Suspended: ${results.suspended}, Errors: ${results.errors.length}`);

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            ...results,
        });
    } catch (error: any) {
        console.error("[SubscriptionCron] Fatal error:", error);
        return NextResponse.json({ error: "Error en el cron de suscripciones", message: error.message }, { status: 500 });
    }
}

// ── Email templates ───────────────────────────────────────────────────────────

function renewalReminderEmail({ businessName, expiryDate, portalUrl }: { businessName: string; expiryDate: string; portalUrl: string }): string {
    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; background: #0a0a0f; padding: 12px 24px; border-radius: 12px;">
                <span style="color: white; font-weight: 900; font-size: 20px;">Cita<span style="color: #3b82f6;">Liks</span></span>
            </div>
        </div>
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
            <div style="width: 48px; height: 4px; background: #3b82f6; border-radius: 2px; margin-bottom: 24px;"></div>
            <h1 style="color: #111827; margin: 0 0 16px; font-size: 24px; font-weight: 800;">Tu suscripción vence pronto</h1>
            <p style="color: #4b5563; line-height: 1.7; font-size: 15px; margin: 0 0 16px;">
                La suscripción de <strong>${businessName}</strong> vence el <strong>${expiryDate}</strong>.
            </p>
            <p style="color: #4b5563; line-height: 1.7; font-size: 15px; margin: 0 0 32px;">
                Si tienes configurado un método de pago válido, la renovación se realizará automáticamente. Si no, tu asistente de voz será pausado al expirar el plazo.
            </p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px; margin-bottom: 32px;">
                <p style="color: #1d4ed8; font-size: 13px; margin: 0; font-weight: 600;">
                    💡 Accede a tu panel para verificar tu método de pago o descargar facturas anteriores.
                </p>
            </div>
            <div style="text-align: center;">
                <a href="${portalUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px;">Gestionar Suscripción</a>
            </div>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">© 2026 CitaLiks · Gestión Inteligente de Citas</p>
    </div>`;
}

function suspensionEmail({ businessName, renewUrl }: { businessName: string; renewUrl: string }): string {
    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; background: #0a0a0f; padding: 12px 24px; border-radius: 12px;">
                <span style="color: white; font-weight: 900; font-size: 20px;">Cita<span style="color: #ef4444;">Liks</span></span>
            </div>
        </div>
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
            <div style="width: 48px; height: 4px; background: #ef4444; border-radius: 2px; margin-bottom: 24px;"></div>
            <h1 style="color: #111827; margin: 0 0 16px; font-size: 24px; font-weight: 800;">Servicio pausado</h1>
            <p style="color: #4b5563; line-height: 1.7; font-size: 15px; margin: 0 0 16px;">
                Tu asistente de voz para <strong>${businessName}</strong> ha sido pausado porque tu suscripción ha expirado.
            </p>
            <p style="color: #4b5563; line-height: 1.7; font-size: 15px; margin: 0 0 32px;">
                Para reactivar el servicio y que tu asistente vuelva a gestionar llamadas y citas, renueva tu suscripción desde tu panel.
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin-bottom: 32px;">
                <p style="color: #dc2626; font-size: 13px; margin: 0; font-weight: 600;">
                    ⚠️ Las llamadas entrantes ya no están siendo atendidas por tu asistente.
                </p>
            </div>
            <div style="text-align: center;">
                <a href="${renewUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px;">Renovar Suscripción</a>
            </div>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">© 2026 CitaLiks · Gestión Inteligente de Citas</p>
    </div>`;
}
