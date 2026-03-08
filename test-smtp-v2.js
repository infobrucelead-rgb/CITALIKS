require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');
const dns = require('dns');

async function test() {
    console.log('--- Diagnóstico SMTP V3 ---');
    console.log('Host:', process.env.SMTP_HOST);

    // Test dns.lookup (uses getaddrinfo)
    try {
        console.log('Probando dns.lookup (getaddrinfo) para:', process.env.SMTP_HOST);
        const { address, family } = await dns.promises.lookup(process.env.SMTP_HOST);
        console.log('Lookup Resuelto:', address, '(IPv' + family + ')');
    } catch (lookupErr) {
        console.error('ERROR LOOKUP:', lookupErr);
    }

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
        console.log('Verificando conexión...');
        await transporter.verify();
        console.log('¡Conexión verificada con éxito!');
    } catch (error) {
        console.error('ERROR SMTP:', error);
    }
}

test();
