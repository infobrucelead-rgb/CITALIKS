
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const logs = await prisma.botLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        console.log('=== BOT LOGS ===');
        logs.forEach(l => {
            console.log(`[${l.createdAt.toISOString()}] ${l.functionName}`);
            console.log(`  Args: ${l.inputArgs}`);
            console.log(`  Error: ${l.errorMsg}`);
            console.log(`  Result: ${l.resultJson}`);
            console.log('---');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
