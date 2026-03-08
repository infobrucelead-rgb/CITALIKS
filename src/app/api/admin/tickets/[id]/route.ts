import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    const { id } = await context.params;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const admin = await prisma.client.findUnique({
            where: { clerkUserId: userId }
        });

        if (!admin || admin.role !== "PLATFORM_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { status, adminNotes, priority } = body;

        // Buscamos el ticket antes de actualizar para tener los datos del cliente
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: { client: true }
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                status: status !== undefined ? status : undefined,
                adminNotes: adminNotes !== undefined ? adminNotes : undefined,
                priority: priority !== undefined ? priority : undefined,
                resolvedAt: status === 'resolved' ? new Date() : undefined
            }
        });

        // Si el estado ha pasado a 'resolved', enviamos email al cliente
        if (status === 'resolved' && ticket.client.email) {
            try {
                await sendEmail({
                    to: ticket.client.email,
                    subject: `Incidencia Resuelta: ${ticket.subject} - CitaLiks`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1f;">
                            <h2 style="color: #059669;">¡Buenas noticias, ${ticket.client.businessName || 'Cliente'}!</h2>
                            <p>Tu incidencia ha sido resuelta con éxito por nuestro equipo técnico.</p>
                            
                            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px solid #dcfce7;">
                                <p style="margin: 0 0 10px 0; font-size: 14px; color: #166534; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Referencia de Incidencia:</p>
                                <p style="margin: 0; font-weight: bold; font-size: 16px;">${ticket.subject}</p>
                                ${adminNotes ? `
                                    <hr style="border: none; border-top: 1px solid #dcfce7; margin: 15px 0;" />
                                    <p style="margin: 0 0 5px 0; font-size: 13px; color: #166534; font-weight: bold;">Notas de Resolución:</p>
                                    <p style="margin: 0; font-style: italic; color: #374151;">${adminNotes}</p>
                                ` : ''}
                            </div>

                            <p>Ya puedes acceder a tu panel de control para verificar los cambios o continuar con tu actividad normal.</p>
                            <p>Gracias por confiar en <strong>CitaLiks</strong>. Seguimos a tu disposición para lo que necesites.</p>
                            
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                            <p style="font-size: 12px; color: #94a3b8; text-align: center;">Digitalizando tu agenda con IA profesional.</p>
                        </div>
                    `
                });
                console.log(`[Tickets] Email de resolución enviado a ${ticket.client.email}`);
            } catch (emailError) {
                console.error("[Tickets] Error enviando email de resolución:", emailError);
            }
        }

        return NextResponse.json({ success: true, ticket: updated });
    } catch (error) {
        console.error("Error updating ticket:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
