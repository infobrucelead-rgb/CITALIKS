import { checkRestaurantAvailability, bookRestaurantTable } from "../src/lib/restaurant";
import { prisma } from "../src/lib/db";

async function testRestaurant() {
    console.log("🚀 Iniciando pruebas de restaurante...");

    // 1. Buscar un cliente de prueba o crear uno
    let client = await prisma.client.findFirst({
        where: { businessType: "restaurante" }
    });

    if (!client) {
        console.log("⚠️ No se encontró cliente restaurante, buscando cualquier cliente...");
        client = await prisma.client.findFirst();
    }

    if (!client) {
        console.error("❌ No hay clientes en la base de datos.");
        return;
    }

    console.log(`✅ Usando cliente: ${client.businessName} (ID: ${client.id})`);

    const testDate = "2026-03-20"; // Viernes (4 en JS con 0=Lunes)
    // En el schema, dayOfWeek 0=Lunes, 4=Viernes
    const dayOfWeek = 4;
    const numGuests = 4;

    console.log("🕒 Creando horario temporal para el test...");
    const schedule = await prisma.schedule.create({
        data: {
            clientId: client.id,
            dayOfWeek,
            openTime: "09:00",
            closeTime: "22:00",
            isOpen: true
        }
    });

    // 2. Probar disponibilidad
    console.log(`\n🔍 Probando disponibilidad para ${numGuests} personas el ${testDate}...`);
    try {
        const availability = await checkRestaurantAvailability({
            clientId: client.id,
            date: testDate,
            numGuests
        });
        console.log("Resultado disponibilidad:", JSON.stringify(availability, null, 2));

        if (availability.available_slots.length > 0) {
            const time = availability.available_slots[0];
            console.log(`\n📅 Reservando mesa a las ${time}...`);
            
            const booking = await bookRestaurantTable({
                clientId: client.id,
                callerName: "Tester Antigravity",
                callerPhone: "+34600112233",
                date: testDate,
                time,
                numGuests,
                notes: "Prueba técnica automática"
            });

            console.log("Resultado reserva:", JSON.stringify(booking, null, 2));
            
            if (booking.confirmed) {
                console.log("🎉 ¡Reserva confirmada con éxito!");
            } else {
                console.log("❌ La reserva falló.");
            }
        } else {
            console.log("ℹ️ No hay huecos para probar la reserva.");
        }
    } catch (err) {
        console.error("❌ Error durante la prueba:", err);
    } finally {
        console.log("\n🧹 Limpiando horario temporal...");
        await prisma.schedule.delete({ where: { id: schedule.id } });
    }
}

testRestaurant()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
