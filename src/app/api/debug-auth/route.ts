import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ authenticated: false });
        }

        const dbUser = await prisma.client.findUnique({
            where: { clerkUserId: userId }
        });

        return NextResponse.json({
            authenticated: true,
            userId,
            dbUserFound: !!dbUser,
            dbRole: dbUser?.role,
            isPlatformAdmin: dbUser?.role === "PLATFORM_ADMIN"
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
