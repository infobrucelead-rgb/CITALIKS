const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function sendTest() {
    const targetEmail = "neuralads.mkt@gmail.com";
    const name = "Negocio de Prueba";
    const paymentUrl = "https://dashboard.citaliks.com/test-payment";

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const attachments = [];
    if (fs.existsSync(logoPath)) {
        attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
        });
    }

    const templates = [
        {
            subject: `[PRUEBA 24H] 🚀 No dejes pasar ni una llamada más en ${name}`,
            html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #f9fafb;">
                <div style="text-align: center; margin-bottom: 25px;">
                     <img src="cid:logo" alt="CitaLiks" style="max-width: 150px;" />
                </div>
                <h2 style="color: #111827; font-size: 20px;">¡Hola ${name}! La oportunidad no espera.</h2>
                <p style="color: #4b5563; line-height: 1.6;">Ayer te enviamos el enlace para activar tu asistente de voz, y queríamos recordarte lo que <strong>CitaLiks</strong> puede hacer por tu negocio desde el minuto 1:</p>
                <ul style="color: #4b5563; line-height: 1.6;">
                    <li><strong>Atención 24/7</strong>: Ni una sola llamada perdida más.</li>
                    <li><strong>Citas Automáticas</strong>: Tu agenda se llena mientras tú descansas.</li>
                    <li><strong>Imagen Profesional</strong>: Una IA de última generación atendiendo a tus clientes.</li>
                </ul>
                <p style="color: #4b5563; line-height: 1.6;">No dejes que el día a día te impida hacer crecer tu negocio.</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${paymentUrl}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Activar mi Asistente Ahora</a>
                </div>
            </div>`
        },
        {
            subject: `[PRUEBA 3 DÍAS] ⌛ ¿Cuántas citas has perdido hoy, ${name}?`,
            html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #f9fafb;">
                <div style="text-align: center; margin-bottom: 25px;">
                     <img src="cid:logo" alt="CitaLiks" style="max-width: 150px;" />
                </div>
                <h2 style="color: #111827; font-size: 20px;">${name}, ¿estás dejando dinero sobre la mesa?</h2>
                <p style="color: #4b5563; line-height: 1.6;">Han pasado 3 días desde que hablamos. Si tu negocio recibe una media de 5-10 llamadas al día, es muy probable que ya hayas perdido <strong>entre 3 y 5 citas potenciales</strong> por no poder atender el teléfono a tiempo.</p>
                <div style="background-color: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 10px; margin: 25px 0;">
                    <p style="margin: 0; color: #111827; font-weight: bold;">Con CitaLiks, esas llamadas se habrían convertido en ingresos.</p>
                </div>
                <p style="color: #4b5563; line-height: 1.6;">Tu asistente está listo para configurarse. No permitas que la competencia atienda las llamadas que tú no puedes coger.</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${paymentUrl}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Recuperar el control de mi agenda</a>
                </div>
            </div>`
        },
        {
            subject: `[PRUEBA FINAL 1 SEMANA] ⚠️ Aviso Final: Desconexión de oferta para ${name}`,
            html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #fef2f2;">
                <div style="text-align: center; margin-bottom: 25px;">
                     <img src="cid:logo" alt="CitaLiks" style="max-width: 150px;" />
                </div>
                <h2 style="color: #991b1b; font-size: 20px;">⚠️ Aviso de desactivación de oferta</h2>
                <p style="color: #7f1d1d; line-height: 1.6;">Hola ${name}, ha pasado una semana y no hemos recibido la confirmación de tu alta en el sistema de CitaLiks.</p>
                <p style="color: #7f1d1d; line-height: 1.6;">Lamentablemente, para mantener la calidad de servicio a nuestros clientes activos, <strong>hemos tenido que liberar el cupo y la oferta asignada a tu negocio</strong>.</p>
                <p style="color: #4b5563; line-height: 1.6;">Si todavía estás interesado en digitalizar tu atención telefónica, esta es tu <strong>última oportunidad</strong> para activar el sistema con las condiciones actuales antes de que cerremos tu expediente.</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${paymentUrl}" style="background-color: #991b1b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Última oportunidad: Recuperar el control de mi agenda</a>
                </div>
                <p style="color: #4b5563; line-height: 1.6;">De lo contrario, deberás volver a concertar una cita con uno de nuestros expertos en el futuro para evaluar una nueva propuesta comercial.</p>
                <p style="color: #4b5563; line-height: 1.6; margin-top: 30px;">Sentimos que no hayamos podido trabajar juntos aún.</p>
            </div>`
        }
    ];

    console.log("Enviando 3 emails de prueba a:", targetEmail);

    for (const t of templates) {
        try {
            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM || `"CitaLiks" <${process.env.SMTP_USER}>`,
                to: targetEmail,
                subject: t.subject,
                html: t.html,
                attachments
            });
            console.log("Enviado:", t.subject, "ID:", info.messageId);
        } catch (e) {
            console.error("Error enviando", t.subject, ":", e.message);
        }
    }
}

sendTest();
