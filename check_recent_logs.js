
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking last 10 logs...');
        const logs = await prisma.botLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        if (logs.length === 0) {
            console.log('No logs found.');
        } else {
            logs.forEach(l => {
                console.log(`[${l.createdAt.toISOString()}] ${l.functionName}`);
                console.log(`  Args: ${l.inputArgs}`);
                console.log(`  Error: ${l.errorMsg || 'None'}`);
                console.log(`  Result: ${l.resultJson || 'None'}`);
                console.log('---');
            });
        }
    } catch (e) {
        console.error('Error fetching logs:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
