import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function run() {
    const clientId = "cmmdolz2y0004fnb6m1ftul81";
    console.log(`Fetching client ${clientId} from production DB...`);

    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });

    if (!client) {
        console.log("Client not found.");
        return;
    }

    console.log("Found:", client.businessName);
    console.log("retellAgentId:", client.retellAgentId);
}

run().catch(console.error).finally(() => prisma.$disconnect());
