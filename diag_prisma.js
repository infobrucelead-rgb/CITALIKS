
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Master Prisma models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));

    // Try to access appointment
    try {
        console.log('Appointment model on Master:', !!prisma.appointment);
        if (prisma.appointment) {
            const count = await prisma.appointment.count();
            console.log('Appointment count on Master:', count);
        }
    } catch (err) {
        console.error('Error accessing Appointment on Master:', err.message);
    }

    await prisma.$disconnect();
}

main();
