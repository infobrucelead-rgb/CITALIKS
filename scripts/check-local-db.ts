import { prisma } from "../src/lib/db";
import "dotenv/config";

async function check() {
    const count = await prisma.client.count();
    console.log("Total clients in DB:", count);
    const clients = await prisma.client.findMany({ select: { email: true, role: true } });
    console.log("Clients:", clients);
}
check().catch(console.error).finally(() => prisma.$disconnect());
