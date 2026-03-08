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
        console.log('[Email] Envelope:', info.envelope);
        console.log('[Email] Response:', info.response);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('[Email] ERROR CRÍTICO al enviar:', error);

        let detailedError = error.message;
        if (error.code === 'EAUTH') {
            detailedError = 'Error de Autenticación SMTP. Revisa SMTP_USER y SMTP_PASS (¿Contraseña de aplicación?).';
            console.error('[Email] Sugerencia: Verifica si necesitas una nueva "Contraseña de aplicación" en Gmail.');
        } else if (error.code === 'ESOCKET') {
            detailedError = 'Error de conexión (Socket). Problema de red o firewall.';
        }

        return {
            success: false,
            error: detailedError,
            code: error.code,
            command: error.command
        };
    }
}
