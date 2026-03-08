import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { phone } = await req.json();
        if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

        // Verify requester is PLATFORM_ADMIN
        const admin = await prisma.client.findUnique({
            where: { clerkUserId: userId },
        });

        if (!admin || admin.role !== "PLATFORM_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const result = await sendSms(phone, "CitaLiks: Mensaje de prueba desde el Panel Master. Tu sistema de SMS está configurado correctamente. 🚀");

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: result.error || "Failed context" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error testing SMS:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
