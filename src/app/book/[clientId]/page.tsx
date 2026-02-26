import { prisma as db } from "@/lib/db";
import { notFound } from "next/navigation";
import BookingClient from "./BookingClient";

export default async function BookingPage({ params }: { params: { clientId: string } }) {
    const { clientId } = await params;

    const client = await db.client.findUnique({
        where: { id: clientId },
        include: {
            staff: true,
            services: true,
        },
    });

    if (!client) {
        return notFound();
    }

    return (
        <main className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                        {client.businessName?.[0] || "C"}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{client.businessName}</h1>
                        <p className="text-white/40 text-sm">Reserva tu cita online</p>
                    </div>
                </div>

                <BookingClient initialClient={client} />
            </div>
        </main>
    );
}
