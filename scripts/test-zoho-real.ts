import { ZohoConnector } from "../src/lib/crm";

async function testZoho() {
    const config = {
        crmClientId: "1000.ZUBXAREG5T4TP3RJUZS8JY8VVWPI9I",
        crmClientSecret: "4c158e2de31fb99c5348dbd4f6371cf99498d41cb6",
        crmRefreshToken: "1000.896bc2096079e93ed8b8a32b1c418e37.7e2622e79e3550b434dee1bc96bdd4ff",
        crmUrl: "eu"
    };

    const crm = new ZohoConnector(config);

    console.log("--- Probando Zoho Connector ---");
    
    // 1. Crear/Actualizar contacto
    const contact = await crm.createOrUpdateContact({
        name: "Test CitaLiks",
        phone: "+34600000000",
        email: "test@citaliks.com"
    });

    if (contact) {
        console.log("✅ Contacto creado/encontrado en Zoho:", contact.id);

        // 2. Log actividad
        const activity = await crm.logActivity({
            contactId: contact.id,
            type: "APPOINTMENT",
            details: "Cita de prueba desde script de validación CitaLiks"
        });

        if (activity) {
            console.log("✅ Actividad registrada en Zoho");
        } else {
            console.error("❌ Error al registrar actividad");
        }
    } else {
        console.error("❌ Error al crear/actualizar contacto");
    }
}

testZoho();
