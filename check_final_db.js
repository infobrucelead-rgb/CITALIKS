
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- NEURAL 360 STATE ---');
    const client = await prisma.client.findUnique({
        where: { id: 'cmm0hcj6w000013wgcfyqalro' },
        include: {
            services: true,
            staff: true,
            schedules: true
        }
    });

    if (!client) {
        console.error('❌ Client cmm0hcj6w000013wgcfyqalro not found!');
        return;
    }

    console.log(`Business: ${client.businessName}`);
    console.log(`Services: ${client.services.map(s => `"${s.name}" (${s.duration}min)`).join(', ')}`);
    console.log(`Staff: ${client.staff.map(s => `"${s.name}"`).join(', ')}`);
    console.log(`Schedules: ${client.schedules.length} entries`);

    if (client.schedules.length > 0) {
        const first = client.schedules[0];
        console.log(`Sample Schedule: Day=${first.dayOfWeek}, Hours=${first.startTime}-${first.endTime}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
