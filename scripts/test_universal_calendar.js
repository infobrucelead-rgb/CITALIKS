const { bookAppointment, checkAvailability } = require('../src/lib/calendar');
const { prisma } = require('../src/lib/db');

async function test() {
    const clientId = "cm7jt7hbe0000uxm8887zphg9"; // Neural 360
    const date = "2026-03-10";
    const time = "10:00";

    console.log("--- TEST: CHECKING AVAILABILITY ---");
    const slots = await checkAvailability(clientId, date);
    console.log("Available slots:", slots.map(s => s.start).join(", "));

    console.log("\n--- TEST: BOOKING NATIVE APPOINTMENT ---");
    const result = await bookAppointment({
        clientId,
        callerName: "Test Pablo",
        serviceName: "Consulta General",
        date,
        time,
        notes: "Test de calendario universal bidireccional"
    });

    console.log("Booking Result:", result);

    console.log("\n--- TEST: RE-CHECKING AVAILABILITY (Should be blocked) ---");
    const slotsAfter = await checkAvailability(clientId, date);
    const isSlotBlocked = !slotsAfter.some(s => s.start === time);
    console.log(`Is slot ${time} blocked?`, isSlotBlocked ? "YES (Success)" : "NO (Failed)");
}

test().catch(console.error).finally(() => prisma.$disconnect());
