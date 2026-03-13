import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/cron/lead-reminders
 * Cron job to follow up with leads who haven't paid.
 * 24h, 3d, and 7d (Final) sequences.
 */
export async function POST(req: NextRequest) {
    // 1. Fail-fast: Validar secreto de CRON inmediatamente
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const results = {
        sent_24h: 0,
        sent_3d: 0,
        sent_7d: 0,
        expired: 0,
        errors: [] as string[]
    };

    try {
        // 1. 24h Reminder: Opportunity & Growth
        const leads24h = await prisma.prospect.findMany({
            where: {
                status: "pending",
                paymentLinkSentAt: { lte: oneDayAgo },
                reminder24hSentAt: null,
                paymentUrl: { not: null }
            }
        });

        for (const lead of leads24h) {
            try {
                await sendEmail({
                    to: lead.email,
                    subject: `🚀 No dejes pasar ni una llamada más en ${lead.name}`,
                    html: reminder24hTemplate({ name: lead.name, paymentUrl: lead.paymentUrl! })
                });
                await prisma.prospect.update({
                    where: { id: lead.id },
                    data: { reminder24hSentAt: now }
                });
                results.sent_24h++;
            } catch (e: any) {
                results.errors.push(`24h ${lead.email}: ${e.message}`);
            }
        }

        // 2. 3 Days Reminder: Value & Loss (Citas perdidas)
        const leads3d = await prisma.prospect.findMany({
            where: {
                status: "pending",
                paymentLinkSentAt: { lte: threeDaysAgo },
                reminder24hSentAt: { not: null },
                reminder3dSentAt: null,
                paymentUrl: { not: null }
            }
        });

        for (const lead of leads3d) {
            try {
                await sendEmail({
                    to: lead.email,
                    subject: `⌛ ¿Cuántas citas has perdido hoy, ${lead.name}?`,
                    html: reminder3dTemplate({ name: lead.name, paymentUrl: lead.paymentUrl! })
                });
                await prisma.prospect.update({
                    where: { id: lead.id },
                    data: { reminder3dSentAt: now }
                });
                results.sent_3d++;
            } catch (e: any) {
                results.errors.push(`3d ${lead.email}: ${e.message}`);
            }
        }

        // 3. 7 Days Final Notice: Offer Expiration
        const leads7d = await prisma.prospect.findMany({
            where: {
                status: "pending",
                paymentLinkSentAt: { lte: sevenDaysAgo },
                reminder3dSentAt: { not: null },
                reminder7dSentAt: null,
                paymentUrl: { not: null }
            }
        });

        for (const lead of leads7d) {
            try {
                await sendEmail({
                    to: lead.email,
                    subject: `⚠️ Aviso Final: Desconexión de oferta para ${lead.name}`,
                    html: reminder7dTemplate({ name: lead.name, paymentUrl: lead.paymentUrl! })
                });
                await prisma.prospect.update({
                    where: { id: lead.id },
                    data: {
                        reminder7dSentAt: now,
                        status: "expired" // Mark as expired
                    }
                });
                results.sent_7d++;
                results.expired++;
            } catch (e: any) {
                results.errors.push(`7d ${lead.email}: ${e.message}`);
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- Templates ---

function reminder24hTemplate({ name, paymentUrl }: { name: string, paymentUrl: string }) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #f9fafb;">
        <div style="text-align: center; margin-bottom: 25px;">
             <img src="cid:logo" alt="CitaLiks" style="max-width: 150px;" />
        </div>
        <h2 style="color: #111827; font-size: 20px;">¡Hola ${name}! La oportunidad no espera.</h2>
        <p style="color: #4b5563; line-height: 1.6;">Ayer te enviamos el enlace para activar tu asistente de voz, y queríamos recordarte lo que <strong>CitaLiks</strong> puede hacer por tu negocio desde el minuto 1:</p>
        <ul style="color: #4b5563; line-height: 1.6;">
            <li><strong>Atención 24/7</strong>: Ni una sola llamada perdida más.</li>
            <li><strong>Citas Automáticas</strong>: Tu agenda se llena mientras tú descansas.</li>
            <li><strong>Imagen Profesional</strong>: Una IA de última generación atendiendo a tus clientes.</li>
        </ul>
        <p style="color: #4b5563; line-height: 1.6;">No dejes que el día a día te impida hacer crecer tu negocio.</p>
        <div style="text-align: center; margin: 35px 0;">
            <a href="${paymentUrl}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Activar mi Asistente Ahora</a>
        </div>
    </div>`;
}

function reminder3dTemplate({ name, paymentUrl }: { name: string, paymentUrl: string }) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #f9fafb;">
        <div style="text-align: center; margin-bottom: 25px;">
             <img src="cid:logo" alt="CitaLiks" style="max-width: 150px;" />
        </div>
        <h2 style="color: #111827; font-size: 20px;">${name}, ¿estás dejando dinero sobre la mesa?</h2>
        <p style="color: #4b5563; line-height: 1.6;">Han pasado 3 días desde que hablamos. Si tu negocio recibe una media de 5-10 llamadas al día, es muy probable que ya hayas perdido <strong>entre 3 y 5 citas potenciales</strong> por no poder atender el teléfono a tiempo.</p>
        <div style="background-color: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 10px; margin: 25px 0;">
            <p style="margin: 0; color: #111827; font-weight: bold;">Con CitaLiks, esas llamadas se habrían convertido en ingresos.</p>
        </div>
        <p style="color: #4b5563; line-height: 1.6;">Tu asistente está listo para configurarse. No permitas que la competencia atienda las llamadas que tú no puedes coger.</p>
        <div style="text-align: center; margin: 35px 0;">
            <a href="${paymentUrl}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Recuperar el control de mi agenda</a>
        </div>
    </div>`;
}

function reminder7dTemplate({ name, paymentUrl }: { name: string, paymentUrl: string }) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #fef2f2;">
        <div style="text-align: center; margin-bottom: 25px;">
             <img src="cid:logo" alt="CitaLiks" style="max-width: 150px;" />
        </div>
        <h2 style="color: #991b1b; font-size: 20px;">⚠️ Aviso de desactivación de oferta</h2>
        <p style="color: #7f1d1d; line-height: 1.6;">Hola ${name}, ha pasado una semana y no hemos recibido la confirmación de tu alta en el sistema de CitaLiks.</p>
        <p style="color: #4b5563; line-height: 1.6;">Lamentablemente, para mantener la calidad de servicio a nuestros clientes activos, <strong>hemos tenido que liberar el cupo y la oferta asignada a tu negocio</strong>.</p>
        <p style="color: #4b5563; line-height: 1.6;">Si todavía estás interesado en digitalizar tu atención telefónica, esta es tu <strong>última oportunidad</strong> para activar el sistema con las condiciones actuales antes de que cerremos tu expediente.</p>
        <div style="text-align: center; margin: 35px 0;">
            <a href="${paymentUrl}" style="background-color: #991b1b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Última oportunidad: Recuperar el control de mi agenda</a>
        </div>
        <p style="color: #4b5563; line-height: 1.6;">De lo contrario, deberás volver a concertar una cita con uno de nuestros expertos en el futuro para evaluar una nueva propuesta comercial.</p>
        <p style="color: #4b5563; line-height: 1.6; margin-top: 30px;">Sentimos que no hayamos podido trabajar juntos aún.</p>
    </div>`;
}
