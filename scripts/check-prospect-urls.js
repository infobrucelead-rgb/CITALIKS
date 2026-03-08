const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
const prisma = new PrismaClient();

async function check() {
    try {
        const prospects = await prisma.prospect.findMany();
        console.log(`Total prospects: ${prospects.length}`);

        const withoutUrl = prospects.filter(p => !p.paymentUrl);
        console.log(`Prospects without paymentUrl: ${withoutUrl.length}`);

        if (withoutUrl.length > 0) {
            console.log("Emails missing URL:");
            withoutUrl.forEach(p => console.log(` - ${p.email}`));
        } else {
            console.log("All prospects have a paymentUrl! ✅");
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
