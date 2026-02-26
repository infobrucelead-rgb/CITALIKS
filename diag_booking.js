
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulate what the bot does when booking
async function checkAvailabilitySimulation(clientId, date, durationMin = 30) {
    const db = prisma;
    const busy = [];

    // Skip Google Calendar check (no OAuth in this script)

    // Get local appointments
    const localAppointments = await db.appointment.findMany({
        where: { clientId, date, status: 'CONFIRMED' }
    });

    localAppointments.forEach(apt => {
        const start = new Date(`${apt.date}T${apt.time}:00`);
        const end = new Date(start.getTime() + durationMin * 60_000);
        busy.push({ start: start.toISOString(), end: end.toISOString() });
    });

    const dbClient = await db.client.findUnique({
        where: { id: clientId },
        include: { schedules: true }
    });

    const dateObj = new Date(`${date}T12:00:00`);
    const dayOfWeek = (dateObj.getDay() + 6) % 7;

    // IMPORTANT: No staffId filter - this is the business-wide schedule
    const schedule = dbClient.schedules.find(s => s.dayOfWeek === dayOfWeek && s.isOpen && !s.staffId);

    if (!schedule) {
        const allForDay = dbClient.schedules.filter(s => s.dayOfWeek === dayOfWeek);
        console.log(`No open schedule for day ${dayOfWeek}. All schedules for this day:`, allForDay.map(s => ({ staffId: s.staffId, isOpen: s.isOpen, time: `${s.openTime}-${s.closeTime}` })));
        return [];
    }

    const slots = [];
    let current = new Date(`${date}T${schedule.openTime}:00`);
    const endLimit = new Date(`${date}T${schedule.closeTime}:00`);

    while (current < endLimit) {
        const slotEnd = new Date(current.getTime() + durationMin * 60_000);
        if (slotEnd > endLimit) break;

        const isOccupied = busy.some(b => {
            const bStart = new Date(b.start);
            const bEnd = new Date(b.end);
            return current < bEnd && slotEnd > bStart;
        });

        const h = current.getHours().toString().padStart(2, '0');
        const m = current.getMinutes().toString().padStart(2, '0');
        const eh = slotEnd.getHours().toString().padStart(2, '0');
        const em = slotEnd.getMinutes().toString().padStart(2, '0');

        if (!isOccupied) {
            slots.push({ start: `${h}:${m}`, end: `${eh}:${em}` });
        }
        current = slotEnd;
    }

    return slots;
}

async function main() {
    const clientId = 'cmm0hcj6w000013wgcfyqalro';
    const testDate = '2026-03-02'; // Monday

    console.log('=== SIMULATING BOT AVAILABILITY CHECK ===');
    const slots = await checkAvailabilitySimulation(clientId, testDate, 30);

    console.log(`\nSlots for ${testDate}:`, slots.length > 0 ? slots.map(s => s.start).join(', ') : 'NONE');

    if (slots.length > 0) {
        const targetTime = '12:00';
        const isSlotFree = slots.some(s => s.start === targetTime);
        console.log(`\nIs ${targetTime} slot free?`, isSlotFree ? '✅ YES - Bot CAN book' : '❌ NO - Bot CANNOT book');

        if (isSlotFree) {
            console.log('\n=== SIMULATING BOOKING ===');
            const newApt = await prisma.appointment.create({
                data: {
                    clientId,
                    callerName: 'Test Bot Simulation',
                    callerPhone: '+34600000001',
                    serviceName: 'pelo',
                    date: testDate,
                    time: targetTime,
                    notes: 'Automated test - can delete'
                }
            });
            console.log('✅ Booking CREATED:', newApt.id);

            // Clean up
            await prisma.appointment.delete({ where: { id: newApt.id } });
            console.log('✅ Test booking cleaned up');
        }
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
