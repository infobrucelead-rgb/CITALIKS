
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testSmtp() {
    console.log('Testing SMTP connection for:', process.env.SMTP_USER);
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('Success: Connection is valid!');

        console.log('Sending test email to:', process.env.SMTP_USER);
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.SMTP_USER,
            subject: 'Test Email from CitaLiks Debug',
            text: 'If you see this, SMTP is working correctly.',
        });
        console.log('Email sent successfully! ID:', info.messageId);
    } catch (error) {
        console.error('FAILED to connect or send email:');
        console.error(error);
    }
}

testSmtp();
