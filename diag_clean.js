
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clientId = 'cmm0hcj6w000013wgcfyqalro';

    // Show all appointments
    const apts = await prisma.appointment.findMany({
        where: { clientId },
        orderBy: [{ date: 'asc' }]
    });

    console.log(`\nTotal appointments: ${apts.length}`);
    apts.forEach(a => {
        console.log(`[${a.id}] ${a.date} ${a.time} - ${a.callerName} - ${a.serviceName} - ${a.status}`);
    });

    // Delete test appointments (callerName contains 'Test')
    const testApts = apts.filter(a => a.callerName.toLowerCase().includes('test') || a.callerName.toLowerCase().includes('pablo'));

    if (testApts.length > 0) {
        console.log(`\nDeleting ${testApts.length} test appointment(s)...`);
        for (const apt of testApts) {
            await prisma.appointment.delete({ where: { id: apt.id } });
            console.log(`  Deleted: [${apt.id}] ${apt.date} ${apt.time} - ${apt.callerName}`);
        }
    } else {
        console.log('\nNo test appointments to clean.');
    }

    const remaining = await prisma.appointment.count({ where: { clientId } });
    console.log(`\nRemaining appointments: ${remaining}`);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
