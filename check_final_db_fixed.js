
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- NEURAL 360 STATE ---');
    const client = await prisma.client.findUnique({
        where: { id: 'cmm0hcj6w000013wgcfyqalro' },
        include: { services: true, staff: true, schedules: true }
    });

    if (!client) {
        console.error('❌ Client not found!');
        return;
    }

    console.log(`Business: ${client.businessName}`);
    client.services.forEach(s => {
        console.log(`Service: "${s.name}" -> durationMin: ${s.durationMin}`);
    });
    client.staff.forEach(st => {
        console.log(`Staff: "${st.name}" -> googleId: ${st.googleCalendarId}`);
    });
    client.schedules.forEach(sc => {
        console.log(`Schedule: Day=${sc.dayOfWeek} Open=${sc.openTime} Close=${sc.closeTime} isOpen=${sc.isOpen} StaffId=${sc.staffId}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
