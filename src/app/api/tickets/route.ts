import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendEmail, renderCorporateEmail } from "@/lib/email";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const client = await prisma.client.findUnique({
            where: { clerkUserId: userId },
            include: {
                tickets: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json({ tickets: client.tickets });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const client = await prisma.client.findUnique({
            where: { clerkUserId: userId }
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        const body = await req.json();
        const { subject, description, category } = body;

        if (!subject || !description || !category) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const ticket = await prisma.ticket.create({
            data: {
                clientId: client.id,
                subject,
                description,
                category,
                status: "open",
                priority: "normal"
            }
        });

        // Solo enviar email si el cliente tiene email configurado
        if (client.email) {
            try {
                await sendEmail({
                    to: client.email,
                    subject: `Confirmación de Ticket: ${subject} - CitaLiks`,
                    html: renderCorporateEmail(
                        `Hola ${client.businessName || 'Cliente'}`,
                        `
                        <p>Hemos recibido tu incidencia correctamente y ya estamos trabajando en tu caso.</p>
                        <div style="background: #f8fafc; border-radius: 12px; padding: 15px; margin: 20px 0; border: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Asunto:</p>
                            <p style="margin: 5px 0 0 0; font-weight: bold;">${subject}</p>
                        </div>
                        <p>Te responderemos a la mayor brevedad posible (normalmente en menos de 24 horas hábiles si tienes un plan Premium).</p>
                        <p>Gracias por tu paciencia.</p>
                        `
                    )
                });
                console.log(`[Tickets] Email de confirmación enviado a ${client.email}`);
            } catch (emailError) {
                console.error("[Tickets] Error enviando email de confirmación:", emailError);
            }
        }

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        console.error("Error creating ticket:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
