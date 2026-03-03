const { PrismaClient } = require("@prisma/client");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const prisma = new PrismaClient();

async function checkBotLogs() {
    try {
        console.log("Leyendo los últimos 10 logs del bot...");
        const logs = await prisma.botLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        console.log(JSON.stringify(logs, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkBotLogs();
