const { PrismaClient } = require("@prisma/client");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const prisma = new PrismaClient();

async function checkErrors() {
    try {
        console.log("Buscando errores de hoy (2026-03-03)...");
        const logs = await prisma.botLog.findMany({
            where: {
                // errorMsg: { not: null },
                createdAt: { gte: new Date('2026-03-03T00:00:00Z') }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (logs.length === 0) {
            console.log("No se encontraron logs para hoy.");
        } else {
            console.log(`Encontrados ${logs.length} logs.`);
            logs.forEach(l => {
                console.log(`[${l.createdAt.toISOString()}] ${l.functionName} - Error: ${l.errorMsg || 'None'} - Confirmed: ${l.confirmed}`);
                if (l.errorMsg) {
                    console.log(`  Args: ${l.inputArgs}`);
                    console.log(`  Result: ${l.resultJson}`);
                }
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkErrors();
