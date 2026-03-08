import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { phone, transferPhone } = body;

        // Verify requester is PLATFORM_ADMIN
        const admin = await prisma.client.findUnique({
            where: { clerkUserId: userId },
        });

        if (!admin || admin.role !== "PLATFORM_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updated = await prisma.client.update({
            where: { clerkUserId: userId },
            data: {
                phone: phone !== undefined ? phone : undefined,
                transferPhone: transferPhone !== undefined ? transferPhone : undefined,
            },
        });

        return NextResponse.json({ success: true, admin: updated });
    } catch (error) {
        console.error("Error updating admin profile:", error);
        return NextResponse.json({ error: "External Server Error" }, { status: 500 });
    }
}
