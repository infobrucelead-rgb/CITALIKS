import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_CLERK_USER_ID = "user_3ATfLC3stOV9446bCGbnzZIFcqd";
const ADMIN_EMAIL = "neuralads.mkt@gmail.com";

async function main() {
    console.log("📋 Listando todos los clientes en la base de datos...");
    const all = await prisma.client.findMany({
        select: { id: true, email: true, clerkUserId: true, businessName: true },
    });
    console.table(all);

    const existingClient = all.find((c) => c.email === ADMIN_EMAIL) || all[0];

    if (!existingClient) {
        console.error("❌ No se encontró ningún cliente en la base de datos.");
        return;
    }

    console.log(`\n🎯 Cliente a actualizar: ${existingClient.businessName} (${existingClient.email})`);
    console.log(`   ClerkUserId actual: ${existingClient.clerkUserId}`);
    console.log(`   ClerkUserId nuevo:  ${NEW_CLERK_USER_ID}`);

    const updated = await prisma.client.update({
        where: { id: existingClient.id },
        data: { clerkUserId: NEW_CLERK_USER_ID },
        select: { id: true, email: true, clerkUserId: true },
    });

    console.log(`\n🎉 ¡Actualizado correctamente! ClerkUserId: ${updated.clerkUserId}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
