import { config } from "dotenv";
config({ path: ".env.local" });

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "../src/lib/db";

async function makeAdmin() {
    console.log("Fetching Clerk users...");
    const users = await clerkClient.users.getUserList();
    console.log(`Found ${users.data.length} users in Clerk.`);

    for (const user of users.data) {
        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) continue;

        console.log(`Processing user: ${email} (ID: ${user.id})`);

        const existing = await prisma.client.findUnique({
            where: { clerkUserId: user.id }
        });

        if (!existing) {
            await prisma.client.create({
                data: {
                    clerkUserId: user.id,
                    email: email,
                    role: "PLATFORM_ADMIN",
                    onboardingDone: true,     // <--- This is the key, skips onboarding!
                    businessName: "Admin User",
                    isActive: true
                }
            });
            console.log(`Created new Admin client in DB for ${email}`);
        } else {
            await prisma.client.update({
                where: { clerkUserId: user.id },
                data: { role: "PLATFORM_ADMIN", onboardingDone: true }
            });
            console.log(`Updated existing client to Admin for ${email}`);
        }
    }
}

makeAdmin()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
