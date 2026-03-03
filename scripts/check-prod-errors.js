require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL no encontrada en .env.local');
    process.exit(1);
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function checkProductionLogs() {
    try {
        console.log('--- ÚLTIMOS LOGS DE ACTIVIDAD (EXITOSOS Y ERRORES) ---');
        const logs = await prisma.botLog.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });

        if (logs.length === 0) {
            console.log('No se encontraron logs en botLog.');
        }

        logs.forEach(log => {
            const status = log.errorMsg ? `ERROR: ${log.errorMsg}` : 'SUCCESS';
            console.log(`[${log.createdAt.toISOString()}] | Function: ${log.functionName} | Status: ${status} | Slots: ${log.slotsFound}`);
        });

    } catch (error) {
        console.error('Error al consultar la base de datos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProductionLogs();
