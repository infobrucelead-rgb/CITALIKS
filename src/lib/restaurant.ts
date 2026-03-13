import { prisma } from "./db";
import { checkAvailability, bookAppointment, TimeSlot } from "./calendar";

/**
 * Interface genérica para conectores de restaurantes.
 * Permite que CitaLiks se comunique con cualquier software externo (CoverManager, TheFork, etc.)
 */
export interface IRestaurantConnector {
    checkAvailability(params: {
        date: string;
        numGuests: number;
    }): Promise<{ available_slots: string[]; message: string }>;

    bookTable(params: {
        callerName: string;
        callerPhone?: string;
        date: string;
        time: string;
        numGuests: number;
        notes?: string;
    }): Promise<{ confirmed: boolean; eventId?: string; error?: string }>;
}

/**
 * Factory para obtener el conector adecuado según la configuración del cliente.
 */
export function getRestaurantConnector(client: any): IRestaurantConnector | null {
    const provider = client.restaurantProvider?.toUpperCase();
    if (!provider || !client.restaurantActive) return null;

    switch (provider) {
        case "COVERMANAGER":
            return new CoverManagerConnector(client);
        case "THEFORK":
            return new TheForkConnector(client);
        case "OPENTABLE":
            return new OpenTableConnector(client);
        case "RESY":
            return new ResyConnector(client);
        case "REVO":
            return new RevoConnector(client);
        default:
            return null;
    }
}

// --- Implementaciones de Conectores (Mocks iniciales) ---

class CoverManagerConnector implements IRestaurantConnector {
    constructor(private config: any) {}
    async checkAvailability(params: any) {
        console.log(`[Restaurant/CoverManager] Consultando disponibilidad para ${params.numGuests} el ${params.date}`);
        return { available_slots: [], message: "Integración con CoverManager lista para configurar API Key." };
    }
    async bookTable(params: any) {
        console.log(`[Restaurant/CoverManager] Reservando para ${params.callerName}`);
        return { confirmed: false, error: "Conector CoverManager en desarrollo." };
    }
}

class TheForkConnector implements IRestaurantConnector {
    constructor(private config: any) {}
    async checkAvailability(params: any) {
        console.log(`[Restaurant/TheFork] Consultando...`);
        return { available_slots: [], message: "Integración con TheFork detectada." };
    }
    async bookTable(params: any) {
        return { confirmed: false, error: "Conector TheFork pendiente de API." };
    }
}

class OpenTableConnector implements IRestaurantConnector {
    constructor(private config: any) {}
    async checkAvailability(params: any) {
        return { available_slots: [], message: "Integración con OpenTable lista." };
    }
    async bookTable(params: any) {
        return { confirmed: false };
    }
}

class ResyConnector implements IRestaurantConnector {
    constructor(private config: any) {}
    async checkAvailability(params: any) {
        return { available_slots: [], message: "Integración con Resy lista." };
    }
    async bookTable(params: any) {
        return { confirmed: false };
    }
}

class RevoConnector implements IRestaurantConnector {
    constructor(private config: any) {}
    async checkAvailability(params: any) {
        return { available_slots: [], message: "Integración con Revo lista." };
    }
    async bookTable(params: any) {
        return { confirmed: false };
    }
}

// --- Lógica Principal del Servicio de Restaurante ---

export interface RestaurantAvailabilityParams {
    clientId: string;
    date: string;
    numGuests: number;
    prismaOverride?: any;
}

export interface TableBookingParams {
    clientId: string;
    callerName: string;
    callerPhone?: string;
    date: string;
    time: string;
    numGuests: number;
    notes?: string;
    prismaOverride?: any;
}

/**
 * Consulta de disponibilidad de mesa.
 * Prioriza conectores externos si están activos, si no usa Google Calendar.
 */
export async function checkRestaurantAvailability(params: RestaurantAvailabilityParams): Promise<{
    available_slots: string[];
    message: string;
}> {
    const db = params.prismaOverride || prisma;
    const client = await db.client.findUnique({
        where: { id: params.clientId }
    });

    if (!client) throw new Error("Cliente no encontrado.");

    // Intentar usar conector externo
    const connector = getRestaurantConnector(client);
    if (connector) {
        return await connector.checkAvailability({
            date: params.date,
            numGuests: params.numGuests
        });
    }

    // Fallback: Google Calendar (como solución low-cost)
    console.log(`[Restaurant/Fallback] Usando Google Calendar para disponibilidad.`);
    const durationMin = 90; 
    const slots = await checkAvailability(params.clientId, params.date, durationMin, {
        prismaOverride: db,
        stepMin: 30
    });

    const slotStrings = slots.map(s => s.start);

    return {
        available_slots: slotStrings,
        message: slots.length > 0 
            ? `Tengo disponibilidad para ${params.numGuests} personas el ${params.date}. Los horarios libres son: ${slotStrings.slice(0, 5).join(", ")}.`
            : `Lo siento, no me quedan mesas para ${params.numGuests} personas el ${params.date}.`
    };
}

/**
 * Reserva de mesa.
 * Prioriza conectores externos si están activos.
 */
export async function bookRestaurantTable(params: TableBookingParams) {
    const db = params.prismaOverride || prisma;
    const client = await db.client.findUnique({
        where: { id: params.clientId }
    });

    if (!client) throw new Error("Cliente no encontrado.");

    // Intentar usar conector externo
    const connector = getRestaurantConnector(client);
    if (connector) {
        return await connector.bookTable({
            callerName: params.callerName,
            callerPhone: params.callerPhone,
            date: params.date,
            time: params.time,
            numGuests: params.numGuests,
            notes: params.notes
        });
    }

    // Fallback: Google Calendar
    console.log(`[Restaurant/Fallback] Reservando mesa en Google Calendar.`);
    const serviceName = `Reserva Mesa (${params.numGuests} personas)`;
    const durationMin = 90;

    const result = await bookAppointment({
        clientId: params.clientId,
        callerName: params.callerName,
        callerPhone: params.callerPhone,
        serviceName,
        date: params.date,
        time: params.time,
        durationMin,
        prismaOverride: db,
        notes: `Comensales: ${params.numGuests}${params.notes ? `\nNotas: ${params.notes}` : ""}`
    });

    if (result.confirmed && result.eventId) {
        await (db as any).appointment.update({
            where: { id: result.eventId },
            data: { numGuests: params.numGuests }
        });
    }

    return result;
}
