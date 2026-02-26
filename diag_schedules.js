
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clientId = 'cmm0hcj6w000013wgcfyqalro';

    const schedules = await prisma.schedule.findMany({
        where: { clientId },
        orderBy: [{ dayOfWeek: 'asc' }],
        include: { staff: true }
    });

    console.log(`\nTotal schedules: ${schedules.length}`);
    const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    const seen = new Set();
    const duplicates = [];

    schedules.forEach(s => {
        const day = days[s.dayOfWeek];
        console.log(`[${s.id}] ${day} staffId=${s.staffId || 'null'} ${s.isOpen ? 'OPEN' : 'CLOSED'} ${s.openTime}-${s.closeTime}`);

        const key = `${s.dayOfWeek}_${s.staffId || 'null'}`;
        if (seen.has(key)) {
            duplicates.push(s);
        } else {
            seen.add(key);
        }
    });

    console.log('\n=== DUPLICATES ===');
    if (duplicates.length === 0) {
        console.log('No duplicates found');
    } else {
        console.log(`Found ${duplicates.length} duplicate schedules:`);
        duplicates.forEach(s => {
            console.log(`  DUPLICATE: ${days[s.dayOfWeek]} [${s.id}] ${s.openTime}-${s.closeTime}`);
        });
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
