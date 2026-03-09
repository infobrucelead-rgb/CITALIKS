import { prisma } from "./db";

export interface CRMContact {
    id: string;
    email?: string;
    name?: string;
    phone?: string;
}

/**
 * Generic CRM Interface
 */
export interface ICRMConnector {
    createOrUpdateContact(params: {
        name: string;
        phone: string;
        email?: string;
    }): Promise<CRMContact | null>;

    logActivity(params: {
        contactId: string;
        type: 'CALL' | 'APPOINTMENT';
        details: string;
    }): Promise<boolean>;
}

/**
 * Factory to get the correct CRM connector
 */
export function getCRMConnector(provider: string | null, clientConfig: any): ICRMConnector | null {
    if (!provider) return null;

    switch (provider.toUpperCase()) {
        case "HUBSPOT":
            return new HubSpotConnector(clientConfig);
        case "PIPEDRIVE":
            return new PipedriveConnector(clientConfig);
        default:
            return null;
    }
}

// --- Specific Implementations ---

class HubSpotConnector implements ICRMConnector {
    private config: any;

    constructor(config: any) {
        this.config = config;
    }

    async createOrUpdateContact(params: any): Promise<CRMContact | null> {
        console.log(`[CRM/HubSpot] Syncing contact ${params.name} (${params.phone})`);
        // Actual implementation would use HubSpot API (Axios/Fetch)
        // https://developers.hubspot.com/docs/api/crm/contacts
        return { id: "HS-MOCK-CONTACT-ID", ...params };
    }

    async logActivity(params: any): Promise<boolean> {
        console.log(`[CRM/HubSpot] Logging ${params.type} for contact ${params.contactId}`);
        return true;
    }
}

class PipedriveConnector implements ICRMConnector {
    private config: any;

    constructor(config: any) {
        this.config = config;
    }

    async createOrUpdateContact(params: any): Promise<CRMContact | null> {
        console.log(`[CRM/Pipedrive] Syncing contact ${params.name} (${params.phone})`);
        // https://developers.pipedrive.com/docs/api/v1/Persons
        return { id: "PIPEDRIVE-MOCK-CONTACT-ID", ...params };
    }

    async logActivity(params: any): Promise<boolean> {
        console.log(`[CRM/Pipedrive] Logging activity...`);
        return true;
    }
}
