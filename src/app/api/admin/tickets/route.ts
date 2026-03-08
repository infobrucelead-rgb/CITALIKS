import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const admin = await prisma.client.findUnique({
            where: { clerkUserId: userId }
        });

        if (!admin || admin.role !== "PLATFORM_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const tickets = await prisma.ticket.findMany({
            include: {
                client: {
                    select: {
                        businessName: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc' // FIFO
            }
        });

        return NextResponse.json({ tickets });
    } catch (error) {
        console.error("Error fetching admin tickets:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
