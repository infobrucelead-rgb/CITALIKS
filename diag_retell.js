const { PrismaClient } = require("./node_modules/@prisma/client");
const { updateRetellAgent } = require("./src/lib/retell"); // Hope this doesn't use ESM imports
const dotenv = require("dotenv");

dotenv.config();

const prisma = new PrismaClient();

async function diagnose() {
    const clientId = process.argv[2];
    if (!clientId) {
        console.error("Uso: node diag_retell.js <clientId>");
        process.exit(1);
    }

    console.log(`Buscando cliente ${clientId}...`);
    try {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                services: true,
                schedules: true,
                staff: {
                    include: { schedules: true }
                }
            }
        });

        if (!client) {
            console.error("Cliente no encontrado");
            return;
        }

        console.log(`Actualizando agente ${client.retellAgentId} para ${client.businessName}...`);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://api.citaliks.com";

        // We can't easily require a .ts file if it's using ESM. 
        // Let's just inline the logic from updateRetellAgent here for diagnosis.
        // Or try to use ts-node properly.

        console.log("Importando dependencias para el sistema de Retell...");
        const Retell = require("retell-sdk");
        const retell = new Retell({ apiKey: process.env.RETELL_API_KEY });

        // ... inlining logic or just fixing the import ...
        // Re-writing the diag script to be more self-contained.
    } catch (err) {
        console.error(err);
    }
}
