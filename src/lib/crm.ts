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

    getBusySlots?(date: string): Promise<{ start: string, end: string }[]>;
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
        case "ZOHO":
            return new ZohoConnector(clientConfig);
        case "WEBHOOK":
            return new WebhookConnector(clientConfig);
        default:
            return null;
    }
}

// --- Specific Implementations ---

export class WebhookConnector implements ICRMConnector {
    private config: any;

    constructor(config: any) {
        this.config = config;
    }

    async createOrUpdateContact(params: { name: string; phone: string; email?: string }): Promise<CRMContact | null> {
        if (!this.config.crmUrl) {
            console.error("[CRM/Webhook] No URL configured");
            return { id: "WEBHOOK-PENDING", ...params };
        }

        try {
            console.log(`[CRM/Webhook] Dispatching contact to ${this.config.crmUrl}`);
            await fetch(this.config.crmUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "CONTACT_SYNC",
                    data: params,
                    apiKey: this.config.crmApiKey // Optional, if they protect their webhook
                })
            });
            return { id: `WEBHOOK-${Date.now()}`, ...params };
        } catch (err) {
            console.warn("[CRM/Webhook] Dispatch failed", (err as any).message);
            return { id: "WEBHOOK-ERROR", ...params };
        }
    }

    async logActivity(params: { contactId: string; type: 'CALL' | 'APPOINTMENT'; details: string }): Promise<boolean> {
        if (!this.config.crmUrl) return false;

        try {
            await fetch(this.config.crmUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "ACTIVITY_LOG",
                    data: params,
                    apiKey: this.config.crmApiKey
                })
            });
            return true;
        } catch (err) {
            return false;
        }
    }

    async getBusySlots(date: string): Promise<{ start: string, end: string }[]> {
        return [];
    }
}


export class ZohoConnector implements ICRMConnector {
    private config: any;
    private baseUrl: string;
    private accountsUrl: string;

    constructor(config: any) {
        this.config = config;
        const region = config.crmUrl?.includes(".com") ? "com" : "eu";
        this.baseUrl = `https://www.zohoapis.${region}/crm/v2`;
        this.accountsUrl = `https://accounts.zoho.${region}/oauth/v2/token`;
    }

    private async getAccessToken(): Promise<string | null> {
        if (!this.config.crmClientId || !this.config.crmClientSecret || !this.config.crmRefreshToken) {
            console.error("[CRM/Zoho] Missing credentials");
            return null;
        }

        try {
            const params = new URLSearchParams({
                refresh_token: this.config.crmRefreshToken,
                client_id: this.config.crmClientId,
                client_secret: this.config.crmClientSecret,
                grant_type: "refresh_token"
            });

            const res = await fetch(this.accountsUrl, {
                method: "POST",
                body: params
            });

            const data = await res.json();
            return data.access_token || null;
        } catch (err) {
            console.error("[CRM/Zoho] Error refreshing token:", err);
            return null;
        }
    }

    async createOrUpdateContact(params: { name: string; phone: string; email?: string }): Promise<CRMContact | null> {
        const token = await this.getAccessToken();
        if (!token) return null;

        try {
            const res = await fetch(`${this.baseUrl}/Contacts/upsert`, {
                method: "POST",
                headers: {
                    "Authorization": `Zoho-oauthtoken ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    data: [{
                        Last_Name: params.name,
                        Phone: params.phone,
                        Email: params.email || ""
                    }],
                    duplicate_check_fields: ["Phone", "Email"]
                })
            });

            const result = await res.json();
            const contactId = result.data?.[0]?.details?.id;
            return contactId ? { id: contactId, ...params } : null;
        } catch (err) {
            console.error("[CRM/Zoho] Error upserting contact:", err);
            return null;
        }
    }

    async logActivity(params: { contactId: string; type: 'CALL' | 'APPOINTMENT'; details: string }): Promise<boolean> {
        const token = await this.getAccessToken();
        if (!token) return false;

        try {
            const res = await fetch(`${this.baseUrl}/Notes`, {
                method: "POST",
                headers: {
                    "Authorization": `Zoho-oauthtoken ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    data: [{
                        Note_Title: params.type === 'CALL' ? "Llamada CitaLiks" : "Cita Agendada",
                        Note_Content: params.details,
                        Parent_Id: params.contactId,
                        $se_module: "Contacts"
                    }]
                })
            });

            const result = await res.json();
            return result.data?.[0]?.status === "success";
        } catch (err) {
            console.error("[CRM/Zoho] Error logging activity:", err);
            return false;
        }
    }

    async getBusySlots(date: string): Promise<{ start: string, end: string }[]> {
        // En Zoho buscaríamos en el módulo de Eventos
        return [];
    }
}

class HubSpotConnector implements ICRMConnector {
    private config: any;

    constructor(config: any) {
        this.config = config;
    }

    async createOrUpdateContact(params: { name: string; phone: string; email?: string }): Promise<CRMContact | null> {
        if (!this.config.crmApiKey) return null;
        try {
            const searchRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.config.crmApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    filterGroups: [{
                        filters: [{ propertyName: "phone", operator: "EQ", value: params.phone }]
                    }]
                })
            });
            const searchData = await searchRes.json();
            if (searchData.total > 0) return { id: searchData.results[0].id, ...params };

            const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.config.crmApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    properties: {
                        firstname: params.name.split(' ')[0],
                        lastname: params.name.split(' ').slice(1).join(' ') || "Cliente",
                        phone: params.phone,
                        email: params.email || ""
                    }
                })
            });
            const createData = await createRes.json();
            return createData.id ? { id: createData.id, ...params } : null;
        } catch (err) {
            return null;
        }
    }

    async logActivity(params: { contactId: string; type: 'CALL' | 'APPOINTMENT'; details: string }): Promise<boolean> {
        if (!this.config.crmApiKey) return false;
        try {
            const res = await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.config.crmApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    properties: {
                        hs_note_body: `<b>${params.type === 'CALL' ? 'Llamada' : 'Cita'} via CitaLiks</b><br>${params.details}`,
                        hs_timestamp: new Date().toISOString()
                    },
                    associations: [
                        { to: { id: params.contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }] }
                    ]
                })
            });
            return res.ok;
        } catch (err) {
            return false;
        }
    }

    async getBusySlots(date: string): Promise<{ start: string, end: string }[]> {
        // En HubSpot buscaríamos en el módulo de Meetings
        return [];
    }
}

class PipedriveConnector implements ICRMConnector {
    private config: any;

    constructor(config: any) {
        this.config = config;
    }

    async createOrUpdateContact(params: { name: string; phone: string; email?: string }): Promise<CRMContact | null> {
        if (!this.config.crmApiKey) return null;
        try {
            const apiToken = this.config.crmApiKey;
            const searchRes = await fetch(`https://api.pipedrive.com/v1/persons/search?term=${encodeURIComponent(params.phone)}&fields=phone&api_token=${apiToken}`);
            const searchData = await searchRes.json();
            if (searchData.data?.items?.length > 0) return { id: searchData.data.items[0].item.id.toString(), ...params };

            const createRes = await fetch(`https://api.pipedrive.com/v1/persons?api_token=${apiToken}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: params.name,
                    phone: [params.phone],
                    email: params.email ? [params.email] : []
                })
            });
            const createData = await createRes.json();
            return createData.data?.id ? { id: createData.data.id.toString(), ...params } : null;
        } catch (err) {
            return null;
        }
    }

    async logActivity(params: { contactId: string; type: 'CALL' | 'APPOINTMENT'; details: string }): Promise<boolean> {
        if (!this.config.crmApiKey) return false;
        try {
            const apiToken = this.config.crmApiKey;
            const res = await fetch(`https://api.pipedrive.com/v1/activities?api_token=${apiToken}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: params.type === 'CALL' ? "Llamada CitaLiks" : "Cita Agendada",
                    type: params.type === 'CALL' ? 'call' : 'meeting',
                    note: params.details,
                    person_id: parseInt(params.contactId),
                    done: 1
                })
            });
            return res.ok;
        } catch (err) {
            return false;
        }
    }

    async getBusySlots(date: string): Promise<{ start: string, end: string }[]> {
        // En Pipedrive buscaríamos en el módulo de Activities filtrando por tipo y fecha
        return [];
    }
}
