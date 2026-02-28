import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    let masterClient = await prisma.client.findUnique({
        where: { clerkUserId: userId },
    });

    // AUTO-CREATE FIRST USER AS ADMIN FOR LOCAL DEV
    if (!masterClient) {
        const userCount = await prisma.client.count();
        if (userCount === 0) {
            masterClient = await prisma.client.create({
                data: {
                    clerkUserId: userId,
                    email: "admin@citaliks.com", // Dummy email para el admin local
                    role: "PLATFORM_ADMIN",
                    onboardingDone: true,
                    businessName: "CitaLiks Admin",
                    isActive: true,
                }
            });
        }
    }

    if (!masterClient || !masterClient.onboardingDone) {
        redirect("/onboarding");
    }

    // If client has an independent database, fetch data from there
    let client = masterClient;
    if ((masterClient as any).databaseUrl) {
        const { getTenantPrisma } = await import("@/lib/db");
        const tenantPrisma = getTenantPrisma((masterClient as any).databaseUrl);

        try {
            const tenantData = await tenantPrisma.client.findFirst({
                where: { clerkUserId: userId },
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

            if (tenantData) {
                client = { ...masterClient, ...tenantData, role: masterClient.role } as any;
            }
        } catch (err) {
            console.error("Error fetching from tenant DB:", err);
            // Fallback to master if tenant DB fails or is not setup yet
        } finally {
            await tenantPrisma.$disconnect();
        }
    } else {
        // Legacy/Master-only mode (everything in one DB)
        const fullClient = await prisma.client.findUnique({
            where: { clerkUserId: userId },
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
        if (fullClient) client = fullClient as any;
    }

    return <DashboardContent client={client} />;
}
