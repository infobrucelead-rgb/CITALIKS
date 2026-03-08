import nodemailer from 'nodemailer';
import path from 'path';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Add connection timeout
    connectionTimeout: 10000,
    greetingTimeout: 5000,
});

export async function sendEmail({ to, subject, html, attachments = [] }: {
    to: string;
    subject: string;
    html: string;
    attachments?: any[];
}) {
    const from = process.env.SMTP_FROM || `"CitaLiks" <${process.env.SMTP_USER}>`;

    // Default logo attachment if exists
    const fs = require('fs');
    const logoRelPath = 'public/logo.png';
    const logoPath = path.join(process.cwd(), logoRelPath);
    let finalAttachments = [...attachments];

    try {
        if (fs.existsSync(logoPath)) {
            finalAttachments.push({
                filename: 'logo.png',
                path: logoPath,
                cid: 'logo'
            });
        } else {
            console.warn(`[Email] Logo no encontrado en ${logoPath}, se enviará sin imagen.`);
        }
    } catch (e) {
        console.error('[Email] Error al verificar logo:', e);
    }

    console.log(`[Email] Intentando enviar a ${to} desde ${from}...`);

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
            attachments: finalAttachments
        });
        console.log('[Email] Enviado con éxito! ID:', info.messageId);
        console.log('[Email] Envelope:', info.envelope);
        console.log('[Email] Response:', info.response);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('[Email] ERROR CRÍTICO al enviar:', error);

        let detailedError = error.message;
        if (error.code === 'EAUTH') {
            detailedError = 'Error de Autenticación SMTP (EAUTH). Revisa usuario y contraseña de aplicación.';
        } else if (error.code === 'ESOCKET') {
            detailedError = 'Error de socket (ESOCKET). ¿El host o puerto son correctos? (Gmail usa 465 SSL o 587 TLS).';
        } else if (error.code === 'ETIMEDOUT') {
            detailedError = 'Tiempo de espera agotado (ETIMEDOUT) al conectar con el servidor SMTP.';
        } else if (error.code === 'EENVELOPE') {
            detailedError = 'Error en el remitente o destinatario (EENVELOPE).';
        }

        return {
            success: false,
            error: detailedError,
            code: error.code || 'UNKNOWN',
            details: error.message
        };
    }
}
