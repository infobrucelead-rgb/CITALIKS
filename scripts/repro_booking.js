const { checkAvailability, bookAppointment } = require('../src/lib/calendar');
const { prisma } = require('../src/lib/db');

async function test() {
    const clientId = 'cmm0hcj6w000013wgcfyqalro';
    const date = '2026-03-02';
    const time = '12:00';
    const serviceName = 'pelo';

    console.log('--- Testing Availability ---');
    const slots = await checkAvailability(clientId, date, 30, { prismaOverride: prisma });
    console.log('Available slots:', slots.map(s => s.start));

    console.log('\n--- Testing Booking ---');
    const result = await bookAppointment({
        clientId,
        callerName: 'Debug User',
        serviceName,
        date,
        time,
        durationMin: 30,
        prismaOverride: prisma
    });

    console.log('\nResult:', JSON.stringify(result, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
