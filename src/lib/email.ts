import nodemailer from 'nodemailer';
import path from 'path';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function sendEmail({ to, subject, html, attachments = [] }: {
    to: string;
    subject: string;
    html: string;
    attachments?: any[];
}, retryCount = 0) {
    const MAX_RETRIES = 3;
    const from = process.env.SMTP_FROM || `"CitaLiks" <${process.env.SMTP_USER}>`;

    // Re-create transporter for each call to avoid stale socket/DNS issues on Windows
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
    });

    // Default logo attachment if exists
    const fs = require('fs');
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    let finalAttachments = [...attachments];

    try {
        if (fs.existsSync(logoPath)) {
            finalAttachments.push({
                filename: 'logo.png',
                path: logoPath,
                cid: 'logo'
            });
        }
    } catch (e) {
        console.error('[Email] Error al verificar logo:', e);
    }

    console.log(`[Email] [Intento ${retryCount + 1}] Enviando a ${to}...`);

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
            attachments: finalAttachments
        });
        console.log('[Email] Enviado con éxito! ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error(`[Email] ERROR en intento ${retryCount + 1}:`, error.code, error.message);

        // Retry logic for transient Windows errors
        const transientErrors = ['EBUSY', 'ECONNRESET', 'ETIMEDOUT', 'ESOCKET', 'EAI_AGAIN'];
        if (transientErrors.includes(error.code) && retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`[Email] Reintentando en ${delay}ms...`);
            await sleep(delay);
            return sendEmail({ to, subject, html, attachments }, retryCount + 1);
        }

        let detailedError = error.message;
        if (error.code === 'EAUTH') {
            detailedError = 'Error de Autenticación SMTP. Revisa tu usuario y contraseña de aplicación en Gmail.';
        } else if (error.code === 'EBUSY') {
            detailedError = 'Servicio de red ocupado (EBUSY). Inténtalo de nuevo.';
        }

        return {
            success: false,
            error: detailedError,
            code: error.code || 'UNKNOWN',
            details: error.message
        };
    }
}
