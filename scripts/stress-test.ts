import { checkAvailability, bookAppointment, cancelAppointment } from "../src/lib/calendar";
import { prisma } from "../src/lib/db";

async function runTests() {
    console.log("🚀 Iniciando Stress Test de CitaLiks...");

    // 1. Setup Test Client
    const testClientId = "test-stress-client";
    const testDate = "2026-03-02"; // Un lunes

    // Check if client exists, otherwise create or use an existing one
    let client = await prisma.client.findFirst();
    if (!client) {
        console.error("❌ No hay clientes en la DB para probar.");
        return;
    }
    const clientId = client.id;
    console.log(`Using Client: ${client.businessName} (${clientId})`);

    // Ensure we have a schedule for Monday (Day 0)
    const existingMon = await prisma.schedule.findFirst({
        where: { clientId, staffId: null, dayOfWeek: 0 }
    });
    if (existingMon) {
        await prisma.schedule.update({
            where: { id: existingMon.id },
            data: { isOpen: true, openTime: "09:00", closeTime: "18:00" }
        });
    } else {
        await prisma.schedule.create({
            data: { clientId, staffId: null, dayOfWeek: 0, isOpen: true, openTime: "09:00", closeTime: "18:00" }
        });
    }

    const results = { pass: 0, fail: 0 };

    const testCase = async (name: string, fn: () => Promise<any>) => {
        try {
            console.log(`\nTesting: ${name}...`);
            await fn();
            console.log(`✅ ${name}: PASS`);
            results.pass++;
        } catch (err: any) {
            console.error(`❌ ${name}: FAIL - ${err.message}`);
            results.fail++;
        }
    };

    // --- TEST CASES ---

    // availability
    await testCase("Check Availability (Full Day)", async () => {
        const slots = await checkAvailability(clientId, testDate);
        if (slots.length === 0) throw new Error("No hay slots disponibles en día abierto");
        console.log(`Found ${slots.length} slots`);
    });

    await testCase("Check Availability (Closed Day - Sunday)", async () => {
        // Ensure sunday is closed
        const existingSun = await prisma.schedule.findFirst({
            where: { clientId, staffId: null as any, dayOfWeek: 6 }
        });
        if (existingSun) {
            await prisma.schedule.update({
                where: { id: existingSun.id },
                data: { isOpen: false }
            });
        } else {
            await prisma.schedule.create({
                data: { clientId, staffId: null as any, dayOfWeek: 6, isOpen: false, openTime: "09:00", closeTime: "18:00" }
            });
        }
        const slots = await checkAvailability(clientId, "2026-03-01"); // Sunday
        if (slots.length > 0) throw new Error("Se encontraron slots en un día cerrado");
    });

    // booking
    let lastEventId = "";
    await testCase("Book Appointment (Normal)", async () => {
        const res = await bookAppointment({
            clientId,
            callerName: "Tester Stress",
            callerPhone: "+34600000000",
            serviceName: "Corte de pelo",
            date: testDate,
            time: "12:30",
            durationMin: 30
        });
        lastEventId = res.eventId;
        if (!res.confirmed) throw new Error(res.error || "La cita no fue confirmada");
    });

    await testCase("Check Availability (After Booking)", async () => {
        const slots = await checkAvailability(clientId, testDate);
        const isOccupied = !slots.some(s => s.start === "12:30");
        if (!isOccupied) throw new Error("El slot 12:30 sigue disponible después de reservar");
    });

    await testCase("Book Appointment (Double Booking Protection)", async () => {
        const res = await bookAppointment({
            clientId,
            callerName: "Tester Double",
            callerPhone: "+34600000000",
            serviceName: "Barba",
            date: testDate,
            time: "12:30"
        });
        if (res.confirmed) throw new Error("Se permitió una reserva duplicada en el mismo slot");
        console.log("Expected rejection received:", res.error);
    });

    // cancellation
    await testCase("Cancel Appointment", async () => {
        const res = await cancelAppointment({
            clientId,
            appointmentId: lastEventId
        });
        if (!res.cancelled) throw new Error(res.message);
    });

    await testCase("Check Availability (After Cancel)", async () => {
        const slots = await checkAvailability(clientId, testDate);
        const isFree = slots.some(s => s.start === "12:30");
        if (!isFree) throw new Error("El slot 12:30 sigue ocupado después de cancelar");
    });

    // edge cases
    await testCase("Book at Closing Time", async () => {
        // Should fail or handle correctly if it overlaps
        try {
            await bookAppointment({
                clientId,
                callerName: "Late Tester",
                callerPhone: "+34600000000",
                serviceName: "Corte",
                date: testDate,
                time: "17:45", // Overlaps with closing at 18:00 if duration > 15
                durationMin: 30
            });
        } catch (e) {
            console.log("Caught expected limit error or social constraint");
        }
    });

    console.log(`\n--- RESULTADOS ---`);
    console.log(`PASSED: ${results.pass}`);
    console.log(`FAILED: ${results.fail}`);

    if (results.fail > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
