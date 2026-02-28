import { prisma } from "../src/lib/db";

async function main() {
    const updated = await prisma.client.updateMany({
        data: { role: "PLATFORM_ADMIN" }
    });
    console.log(`Updated ${updated.count} clients to PLATFORM_ADMIN.`);

    const clients = await prisma.client.findMany({
        select: { email: true, role: true }
    });
    console.log("Current clients:", clients);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
