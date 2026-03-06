import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching neuralads...");
    try {
        const userId = 'user_2ngy4zKq9P8zJQvKqP8zJQvKqP8'; // Dummy ID, but we lookup by email first to get the real clerk ID
        const user = await prisma.client.findFirst({ where: { email: 'admin@citaliks.com' } });
        if (!user) throw new Error("No user found");
        console.log("Real clerkUserId:", user.clerkUserId);

        const fullClient = await prisma.client.findUnique({
            where: { clerkUserId: user.clerkUserId },
            include: {
                services: true,
                schedules: true,
                staff: true,
                callLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });
        console.log("Fetch success!");
        console.log(Object.keys(fullClient || {}));
    } catch (err) {
        console.error("Crash during fetch!");
        console.error(err);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
