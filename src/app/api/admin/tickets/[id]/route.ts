import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    const { id } = params;

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

        const body = await req.json();
        const { status, adminNotes, priority } = body;

        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                status: status !== undefined ? status : undefined,
                adminNotes: adminNotes !== undefined ? adminNotes : undefined,
                priority: priority !== undefined ? priority : undefined,
                resolvedAt: status === 'resolved' ? new Date() : undefined
            }
        });

        return NextResponse.json({ success: true, ticket: updated });
    } catch (error) {
        console.error("Error updating ticket:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
