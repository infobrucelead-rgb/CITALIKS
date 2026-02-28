import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
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
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9fafb;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <img src="cid:logo" alt="CitaLiks" style="max-width: 200px; height: auto;" />
                </div>
                <div style="background-color: white; padding: 35px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                    <h1 style="color: #111827; margin-top: 0; font-size: 24px; text-align: center; font-weight: 800; letter-spacing: -0.025em;">¡Bienvenido a la revolución de las citas!</h1>
                    <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-top: 20px;">Has sido invitado a configurar tu asistente de voz con IA para <strong>${businessName || "tu negocio"}</strong>.</p>
                    <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Con <strong>CitaLiks</strong>, tu negocio podrá atender llamadas y gestionar citas de forma automática las 24 horas del día.</p>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px; transition: all 0.2s;">Configurar mi Asistente</a>
                    </div>
                    <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 20px;">
                        <p style="color: #6b7280; font-size: 13px; text-align: center;">Si el botón no funciona, copia y pega este enlace:</p>
                        <p style="color: #2563eb; font-size: 11px; word-break: break-all; text-align: center; opacity: 0.8;">${inviteLink}</p>
                    </div>
                </div>
                <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 25px;">© 2026 CitaLiks. Gestión Inteligente de Citas.</p>
            </div>
        `
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
