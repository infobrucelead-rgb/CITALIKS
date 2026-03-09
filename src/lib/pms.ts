import { prisma } from "./db";

export interface PMSAvailability {
    isAvailable: boolean;
    slots?: { start: string, end: string }[];
}

/**
 * Generic PMS Interface
 */
export interface IPMSConnector {
    getBusySlots(date: string): Promise<{ start: string, end: string }[]>;
    createAppointment(params: {
        name: string,
        phone: string | null,
        date: string,
        time: string,
        service: string
    }): Promise<{ id: string, error?: string }>;
}

/**
 * Factory to get the correct PMS connector based on client config
 */
export function getPMSConnector(pmsProvider: string | null, clientConfig: any): IPMSConnector | null {
    if (!pmsProvider) return null;

    switch (pmsProvider.toUpperCase()) {
        case "CLOUDBEDS":
            return new CloudbedsConnector(clientConfig);
        default:
            return null;
    }
}

class CloudbedsConnector implements IPMSConnector {
    private config: any;

    constructor(config: any) {
        this.config = config;
    }

    async getBusySlots(date: string): Promise<{ start: string, end: string }[]> {
        // Here we would call Cloudbeds API using this.config.pmsApiKey and this.config.pmsUrl
        console.log(`[PMS/Cloudbeds] Fetching busy slots for date ${date}`);
        return []; // Placeholder
    }

    async createAppointment(params: any): Promise<{ id: string, error?: string }> {
        console.log(`[PMS/Cloudbeds] Creating reservation for ${params.name}`);
        // Implementation would go here
        return { id: "CLOUDBEDS-MOCK-ID" };
    }
}
