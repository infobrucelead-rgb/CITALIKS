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
});

export async function sendEmail({ to, subject, html, attachments = [] }: {
    to: string;
    subject: string;
    html: string;
    attachments?: any[];
}) {
    const from = process.env.SMTP_FROM || `"CitaLiks" <${process.env.SMTP_USER}>`;

    // Default logo attachment if not provided
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const finalAttachments = [
        {
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo' // matches <img src="cid:logo">
        },
        ...attachments
    ];

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
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('[Email] ERROR CRÍTICO al enviar:', error.message);
        if (error.code === 'EAUTH') {
            console.error('[Email] Error de Autenticación. Revisa tu SMTP_USER y SMTP_PASS.');
        }
        return { success: false, error: error.message };
    }
}
