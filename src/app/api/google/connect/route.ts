import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getGoogleAuthUrl } from "@/lib/calendar";
import { prisma } from "@/lib/db";

// Initiate Google Calendar OAuth flow
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        let client = await prisma.client.findUnique({
            where: { clerkUserId: userId },
            select: { id: true },
        });

        // If client doesn't exist for some reason, create a stub
        if (!client) {
            console.log("Client not found for user, creating stub...");
            const user = await currentUser();
            const email = user?.emailAddresses[0]?.emailAddress || "email@pendiente.com";

            client = await prisma.client.create({
                data: {
                    clerkUserId: userId,
                    businessName: "Mi Negocio",
                    email: email,
                },
                select: { id: true },
            });
        }

        const token = req.nextUrl.searchParams.get("token");
        const state = token ? `${client.id}:${token}` : client.id;

        // Compute the absolute redirect URI based on the request origin dynamically
        const redirectUri = `${req.nextUrl.origin}/api/google/callback`;
        const url = getGoogleAuthUrl(state, redirectUri);

        // Ensure valid absolute URL
        return NextResponse.redirect(new URL(url));
    } catch (error: any) {
        console.error("Error in /api/google/connect:", error);
        return NextResponse.json({
            error: "Error interno al conectar con Google",
            details: error.message
        }, { status: 500 });
    }
}
