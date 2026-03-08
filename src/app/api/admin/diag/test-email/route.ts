import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

        const admin = await prisma.client.findUnique({
            where: { clerkUserId: userId }
        }) as any;

        if (!admin || admin.role !== "PLATFORM_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        let body;
        try {
            body = await req.json();
        } catch (e) {
            body = {};
        }

        const { email } = body;
        const testEmail = email || process.env.SMTP_USER;

        if (!testEmail) {
            return NextResponse.json({ error: "No hay destinatario para la prueba" }, { status: 400 });
        }

        console.log(`[Diag] Ejecutando prueba de SMTP hacia: ${testEmail}`);

        const result = await sendEmail({
            to: testEmail,
            subject: "Prueba de Diagnóstico SMTP - CitaLiks",
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #2563eb;">Prueba de Conexión SMTP</h2>
                    <p>Si has recibido este correo, la configuración de <strong>SMTP</strong> en este entorno es correcta.</p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">
                        <strong>Enviado desde:</strong> ${process.env.SMTP_USER}<br />
                        <strong>Host:</strong> ${process.env.SMTP_HOST}<br />
                        <strong>Puerto:</strong> ${process.env.SMTP_PORT}
                    </p>
                </div>
            `
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[Diag] Error fatal en test-email:", error);
        return NextResponse.json({
            success: false,
            error: `Error interno del servidor: ${error.message}`
        }, { status: 500 });
    }
}
