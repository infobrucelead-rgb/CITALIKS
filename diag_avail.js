
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clientId = 'cmm0hcj6w000013wgcfyqalro';

    // Check client data
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { schedules: true, services: true }
    });

    console.log('\n=== CLIENT ===');
    console.log('Business:', client.businessName);
    console.log('Has Google Token:', !!client.googleAccessToken);
    console.log('Calendar ID:', client.calendarId);
    console.log('databaseUrl:', client.databaseUrl ? 'YES (tenant DB!)' : 'NO (uses master)');

    console.log('\n=== SCHEDULES ===');
    if (!client.schedules.length) {
        console.log('⚠️ NO SCHEDULES FOUND - This is why the bot sees no availability!');
    } else {
        client.schedules.forEach(s => {
            const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
            console.log(`${days[s.dayOfWeek]}: ${s.isOpen ? 'OPEN' : 'CLOSED'} ${s.openTime}-${s.closeTime}`);
        });
    }

    console.log('\n=== SERVICES ===');
    if (!client.services.length) {
        console.log('⚠️ NO SERVICES FOUND');
    } else {
        client.services.forEach(s => {
            console.log(`- ${s.name} (${s.durationMin} min)`);
        });
    }

    // Simulate checking availability for 2026-03-02 (Sunday)
    const testDate = '2026-03-02';
    const dateObj = new Date(`${testDate}T12:00:00`);
    const dayIndex = (dateObj.getDay() + 6) % 7; // 0=Mon
    const dayNames = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

    console.log(`\n=== AVAILABILITY CHECK for ${testDate} ===`);
    console.log(`Day of week index: ${dayIndex} (${dayNames[dayIndex]})`);

    const schedule = client.schedules.find(s => s.dayOfWeek === dayIndex && s.isOpen);
    if (!schedule) {
        console.log(`⚠️ NO OPEN SCHEDULE for day ${dayIndex} (${dayNames[dayIndex]})`);
        console.log('Available schedules days:', client.schedules.filter(s => s.isOpen).map(s => `${s.dayOfWeek}(${dayNames[s.dayOfWeek]})`).join(', ') || 'NONE');
    } else {
        console.log(`✅ Schedule found: ${schedule.openTime} - ${schedule.closeTime}`);
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
