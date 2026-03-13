import { prisma } from "../src/lib/db";
import { checkRestaurantAvailability, bookRestaurantTable } from "../src/lib/restaurant";

async function testConnectors() {
    console.log("🚀 Probando conectores de restaurante...");

    const clientId = "cmmf62z4t0004vri49mswgnv5"; // Cliente de prueba
    
    // 1. Simular configuración de CoverManager
    console.log("\n⚙️ Configurando cliente para CoverManager...");
    await prisma.client.update({
        where: { id: clientId },
        data: {
            restaurantProvider: "COVERMANAGER",
            restaurantActive: true,
            restaurantApiKey: "fake-api-key"
        }
    });

    console.log("🔍 Probando disponibilidad con CoverManager...");
    const availabilityCM = await checkRestaurantAvailability({
        clientId,
        date: "2026-03-25",
        numGuests: 2
    });
    console.log("Resultado CM:", availabilityCM.message);

    // 2. Simular configuración de TheFork
    console.log("\n⚙️ Configurando cliente para TheFork...");
    await prisma.client.update({
        where: { id: clientId },
        data: {
            restaurantProvider: "THEFORK",
            restaurantActive: true
        }
    });

    console.log("🔍 Probando disponibilidad con TheFork...");
    const availabilityTF = await checkRestaurantAvailability({
        clientId,
        date: "2026-03-25",
        numGuests: 2
    });
    console.log("Resultado TF:", availabilityTF.message);

    // 3. Desactivar conectores (Fallback a Google Calendar)
    console.log("\n⚙️ Desactivando conectores externos...");
    await prisma.client.update({
        where: { id: clientId },
        data: {
            restaurantActive: false
        }
    });

    console.log("🔍 Probando disponibilidad (Fallback Google Calendar)...");
    const availabilityFallback = await checkRestaurantAvailability({
        clientId,
        date: "2026-03-25",
        numGuests: 2
    });
    console.log("Resultado Fallback:", availabilityFallback.message);

    console.log("\n✅ Pruebas de conectores completadas.");
}

testConnectors()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
