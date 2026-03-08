import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { sendEmail, renderCorporateEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // Check if user is platform admin
    const adminClient = await prisma.client.findUnique({
        where: { clerkUserId: userId }
    }) as any;

    if (!adminClient || adminClient.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { email, businessName } = await req.json();

    if (!email) return NextResponse.json({ error: "Email faltante" }, { status: 400 });

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Persist invitation
    await prisma.invitation.create({
        data: {
            email,
            businessName,
            token,
            status: "PENDING"
        }
    });

    const appUrl = req.nextUrl.origin;
    const inviteLink = `${appUrl}/onboarding?token=${token}&email=${encodeURIComponent(email)}`;

    // Send Real Email
    const emailResult = await sendEmail({
        to: email,
        subject: `Bienvenido a CitaLiks - Invitación para ${businessName || "tu negocio"}`,
        html: renderCorporateEmail(
            "¡Bienvenido a la revolución de las citas!",
            `
            <p>Has sido invitado a configurar tu asistente de voz con IA para <strong>${businessName || "tu negocio"}</strong>.</p>
            <p>Con <strong>CitaLiks</strong>, tu negocio podrá atender llamadas y gestionar citas de forma automática las 24 horas del día.</p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px; transition: all 0.2s;">Configurar mi Asistente</a>
            </div>
            <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 20px;">
                <p style="color: #6b7280; font-size: 13px; text-align: center;">Si el botón no funciona, copia y pega este enlace:</p>
                <p style="color: #2563eb; font-size: 11px; word-break: break-all; text-align: center; opacity: 0.8;">${inviteLink}</p>
            </div>
            `
        )
    });

    return NextResponse.json({
        success: emailResult.success,
        inviteLink,
        message: emailResult.success ? "Invitación enviada correctamente" : "Invitación registrada pero error al enviar email"
    });
}

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const adminClient = await prisma.client.findUnique({
        where: { clerkUserId: userId }
    }) as any;

    if (!adminClient || adminClient.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const invitations = await prisma.invitation.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ invitations });
}
export async function DELETE(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const adminClient = await prisma.client.findUnique({
        where: { clerkUserId: userId }
    }) as any;

    if (!adminClient || adminClient.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { invitationId } = await req.json();
    if (!invitationId) return NextResponse.json({ error: "ID de invitación faltante" }, { status: 400 });

    await prisma.invitation.delete({
        where: { id: invitationId }
    });

    return NextResponse.json({ success: true, message: "Invitación eliminada" });
}
