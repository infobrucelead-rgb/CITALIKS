import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    const from = process.env.SMTP_FROM || `"CitaLiks" <${process.env.SMTP_USER}>`;

    console.log(`[Email] Intentando enviar a ${to} desde ${from}...`);
    console.log(`[Email] Config: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (User: ${process.env.SMTP_USER})`);

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
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
