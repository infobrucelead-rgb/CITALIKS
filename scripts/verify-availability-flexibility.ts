import { checkAvailability } from "../src/lib/calendar";
import { prisma } from "../src/lib/db";

async function testFlexibleSlots() {
    const clientId = "cmm7m8g2c0000nhzgp9395yje"; // CitaLiks
    const date = "2026-06-10"; // A future date (Wednesday)

    console.log("--- Testing 30-min service (default) ---");
    const slots30 = await checkAvailability(clientId, date, 30);
    console.log(`Slots found: ${slots30.length}`);
    console.log("First 3 slots:", slots30.slice(0, 3));

    console.log("\n--- Testing 45-min service (step 30-min) ---");
    // We expect slots to be offered every 30 mins: 09:00, 09:30, 10:00...
    // even though the service is 45 mins.
    const slots45 = await checkAvailability(clientId, date, 45, { stepMin: 30 });
    console.log(`Slots found: ${slots45.length}`);
    console.log("First 5 slots:", slots45.slice(0, 5));

    const startTimes = slots45.map(s => s.start);
    const has0930 = startTimes.includes("09:30");
    const has1000 = startTimes.includes("10:00");

    if (has0930 && has1000) {
        console.log("\nSUCCESS: Flexible slots (every 30 mins) are being offered correctly for a 45-min service.");
    } else {
        console.log("\nFAILURE: Slots are not offered at 30-min intervals.");
    }
}

testFlexibleSlots().catch(console.error).finally(() => prisma.$disconnect());
