import { config } from "dotenv";
config({ path: ".env.local" });

import nodemailer from 'nodemailer';

async function testSMTP() {
    console.log("🚀 Iniciando prueba de SMTP...");

    const settings = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // Añadimos esto para depuración
        debug: true,
        logger: true
    };

    console.log("⚙️ Configuración detectada:", {
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        user: settings.auth.user,
        pass: settings.auth.pass ? "**** (oculto)" : "FALTANTE"
    });

    const transporter = nodemailer.createTransport(settings as any);

    try {
        console.log("🔗 Verificando conexión...");
        await transporter.verify();
        console.log("✅ Conexión verificada con éxito!");

        console.log("📧 Intentando enviar email de prueba...");
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"CitaLiks Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Se auto-envía a sí mismo para probar
            subject: "Prueba de CitaLiks SMTP",
            text: "Si recibes esto, la configuración es correcta.",
        });

        console.log("🎉 Email enviado con éxito! ID:", info.messageId);
    } catch (error: any) {
        console.error("❌ ERROR CRÍTICO:");
        console.error("Mensaje:", error.message);
        console.error("Código:", error.code);
        console.error("Comando:", error.command);
        console.error("Respuesta:", error.response);

        if (error.code === 'EAUTH') {
            console.log("💡 Consejo: Revisa el usuario y contraseña. Si es Hostalia, asegúrate de que no haya bloqueos IP.");
        } else if (error.code === 'ESOCKET') {
            console.log("💡 Consejo: El puerto o el host podrían estar mal, o el servidor requiere SSL/TLS diferente.");
        }
    }
}

testSMTP();
