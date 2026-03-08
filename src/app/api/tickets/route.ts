import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const client = await prisma.client.findUnique({
            where: { clerkUserId: userId },
            include: {
                tickets: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json({ tickets: client.tickets });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const client = await prisma.client.findUnique({
            where: { clerkUserId: userId }
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        const body = await req.json();
        const { subject, description, category } = body;

        if (!subject || !description || !category) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const ticket = await prisma.ticket.create({
            data: {
                clientId: client.id,
                subject,
                description,
                category,
                status: "open",
                priority: "normal"
            }
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        console.error("Error creating ticket:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
