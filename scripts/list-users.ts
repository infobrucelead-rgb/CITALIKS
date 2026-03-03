import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../src/lib/db";

async function main() {
    const clients = await prisma.client.findMany({
        select: { id: true, email: true, role: true, businessName: true }
    });
    console.log("Current clients:", clients);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
