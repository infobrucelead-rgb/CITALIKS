import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminDashboardContent from "./AdminDashboardContent";

export default async function AdminDashboardPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // Check if user is platform admin (only in master DB)
    const client = await prisma.client.findUnique({
        where: { clerkUserId: userId },
    });

    if (!client || client.role !== "PLATFORM_ADMIN") {
        return (
            <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-10">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-black text-red-500">ACCESO DENEGADO</h1>
                    <p className="text-white/40">No tienes permisos para acceder a esta sección de la plataforma.</p>
                    <a href="/dashboard" className="inline-block bg-white text-black px-6 py-2 rounded-xl font-bold">Volver al Dashboard</a>
                </div>
            </div>
        );
    }

    // Fetch all clients for the admin view
    const allClients = await prisma.client.findMany({
        include: {
            _count: {
                select: { callLogs: true, services: true, staff: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return <AdminDashboardContent clients={allClients} />;
}
