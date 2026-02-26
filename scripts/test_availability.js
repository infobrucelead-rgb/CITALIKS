const { checkAvailability } = require('./src/lib/calendar');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clientId = "cmm0hcj6w000013wgcfyqalro"; // Neural 360
    const date = "2026-02-25";
    const durationMin = 30;

    console.log(`Checking availability for client ${clientId} on ${date}...`);
    try {
        const slots = await checkAvailability(clientId, date, durationMin, prisma);
        console.log("Slots found:", JSON.stringify(slots, null, 2));
    } catch (err) {
        console.error("Internal Check Failed:", err);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
