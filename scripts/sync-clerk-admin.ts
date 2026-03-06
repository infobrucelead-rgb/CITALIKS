import { config } from "dotenv";
config({ path: ".env.local" });

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "../src/lib/db";

async function makeAdmin() {
    console.log("Fetching Clerk users...");
    const client = await clerkClient();
    const users = await client.users.getUserList();
    console.log(`Found ${users.data.length} users in Clerk.`);

    for (const user of users.data) {
        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) continue;

        const TARGET_EMAIL = "neuralads.mkt@gmail.com";

        if (email === TARGET_EMAIL) {
            console.log(`Promoting target user: ${email} (ID: ${user.id})`);
            const existing = await prisma.client.findUnique({
                where: { clerkUserId: user.id }
            });

            if (!existing) {
                await prisma.client.create({
                    data: {
                        clerkUserId: user.id,
                        email: email,
                        role: "PLATFORM_ADMIN",
                        onboardingDone: true,
                        businessName: "CitaLiks Admin",
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
        } else {
            // Force non-admins out to standard role if they were previously admin
            const existing = await prisma.client.findUnique({
                where: { clerkUserId: user.id }
            });

            if (existing && existing.role === "PLATFORM_ADMIN") {
                await prisma.client.update({
                    where: { clerkUserId: user.id },
                    data: { role: "BUSINESS" }
                });
                console.log(`Demoted previous admin: ${email}`);
            }
        }
    }
}

makeAdmin()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
