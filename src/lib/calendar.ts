import { google } from "googleapis";
import { prisma } from "./db";
import { getPMSConnector } from "./pms";
import { getCRMConnector } from "./crm";
import { CalendarProvider } from "@prisma/client";
import { getRestaurantConnector } from "./restaurant";

// --- Google Utils ---
function getOAuthClient(redirectUri?: string) {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri || process.env.GOOGLE_REDIRECT_URI
    );
}

export function getGoogleAuthUrl(clientId: string, redirectUri?: string): string {
    const oAuth2Client = getOAuthClient(redirectUri);
    return oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/calendar"],
        state: clientId,
    });
}

// --- Microsoft Outlook Utils ---
export function getMicrosoftAuthUrl(clientId: string): string {
    const tenant = "common";
    const client_id = process.env.MICROSOFT_CLIENT_ID;
    const redirect_uri = process.env.MICROSOFT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/microsoft/callback`;
    const scopes = encodeURIComponent("offline_access Calendars.Read Calendars.ReadWrite");

    return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&response_mode=query&scope=${scopes}&state=${clientId}`;
}

export async function exchangeCodeForTokens(
    code: string,
    clientId: string,
    redirectUri?: string
): Promise<void> {
    const oAuth2Client = getOAuthClient(redirectUri);
    const { tokens } = await oAuth2Client.getToken(code);

    await prisma.client.update({
        where: { id: clientId },
        data: {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token ?? undefined,
            googleTokenExpiry: tokens.expiry_date
                ? new Date(tokens.expiry_date)
                : undefined,
        },
    });
}

export async function listGoogleCalendars(clientId: string, prismaOverride?: any) {
    try {
        const { oAuth2Client } = await getAuthenticatedGoogleClient(clientId, prismaOverride || prisma);
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
        const res = await calendar.calendarList.list();
        return res.data.items || [];
    } catch (err) {
        console.error("[calendar/listGoogleCalendars] Error fetching calendars:", err);
        return [];
    }
}

export async function exchangeMicrosoftCodeForTokens(
    code: string,
    clientId: string
): Promise<void> {
    const client_id = process.env.MICROSOFT_CLIENT_ID;
    const client_secret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirect_uri = process.env.MICROSOFT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/microsoft/callback`;

    const res = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: client_id!,
            client_secret: client_secret!,
            code,
            redirect_uri,
            grant_type: "authorization_code",
        }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || "Microsoft token exchange failed");

    await prisma.client.update({
        where: { id: clientId },
        data: {
            microsoftAccessToken: data.access_token,
            microsoftRefreshToken: data.refresh_token,
            microsoftTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
            activeCalendarProvider: "MICROSOFT"
        },
    });
}

async function getAuthenticatedMicrosoftClient(clientId: string, db: any) {
    const client = await db.client.findUnique({
        where: { id: clientId },
        select: {
            microsoftAccessToken: true,
            microsoftRefreshToken: true,
            microsoftTokenExpiry: true,
        },
    });

    if (!client?.microsoftAccessToken) throw new Error("Microsoft not connected");

    let accessToken = client.microsoftAccessToken;

    if (client.microsoftTokenExpiry && client.microsoftTokenExpiry.getTime() < Date.now()) {
        const client_id = process.env.MICROSOFT_CLIENT_ID;
        const client_secret = process.env.MICROSOFT_CLIENT_SECRET;

        const res = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: client_id!,
                client_secret: client_secret!,
                refresh_token: client.microsoftRefreshToken!,
                grant_type: "refresh_token",
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error("Microsoft token refresh failed");

        accessToken = data.access_token;
        await db.client.update({
            where: { id: clientId },
            data: {
                microsoftAccessToken: data.access_token,
                microsoftRefreshToken: data.refresh_token || client.microsoftRefreshToken,
                microsoftTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
            },
        });
    }

    return accessToken;
}

async function fetchICalBusySlots(url: string, date: string): Promise<{ start: string, end: string }[]> {
    try {
        const res = await fetch(url);
        const text = await res.text();
        const busy: { start: string, end: string }[] = [];

        const events = text.split("BEGIN:VEVENT");
        for (const event of events) {
            const startMatch = event.match(/DTSTART[:;](?:VALUE=DATE:)?(\d{8}T\d{6}Z?)/);
            const endMatch = event.match(/DTEND[:;](?:VALUE=DATE:)?(\d{8}T\d{6}Z?)/);

            if (startMatch && endMatch) {
                const parseDate = (d: string) => {
                    const year = d.substring(0, 4);
                    const month = d.substring(4, 6);
                    const day = d.substring(6, 8);
                    const hour = d.substring(9, 11);
                    const min = d.substring(11, 13);
                    const sec = d.substring(13, 15);
                    return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`).toISOString();
                };

                const start = parseDate(startMatch[1]);
                const end = parseDate(endMatch[1]);

                if (start.startsWith(date)) {
                    busy.push({ start, end });
                }
            }
        }
        return busy;
    } catch (err) {
        console.warn(`[calendar/fetchICal] Error:`, err);
        return [];
    }
}

// --- Generic Busy Slots Fetcher ---
async function getBusySlots(
    clientId: string,
    date: string,
    provider: CalendarProvider,
    db: any,
    params?: any
): Promise<{ start: string, end: string }[]> {
    const busy: { start: string, end: string }[] = [];
    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client) return [];

    // --- 1. Primary Calendar Provider (Google, Microsoft, ICAL, PMS) ---
    // Note: Google Master is already handled within getAuthenticatedGoogleClient fallback
    if (provider === "GOOGLE") {
        try {
            const { oAuth2Client, calendarId } = await getAuthenticatedGoogleClient(clientId, db, params?.staffCalendarId);
            const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
            const madridOffset = getMadridOffset(date);
            const startOfDay = new Date(new Date(`${date}T00:00:00Z`).getTime() - madridOffset * 3600000);
            const endOfDay = new Date(new Date(`${date}T23:59:59Z`).getTime() - madridOffset * 3600000);

            const res = await calendar.freebusy.query({
                requestBody: {
                    timeMin: startOfDay.toISOString(),
                    timeMax: endOfDay.toISOString(),
                    items: [{ id: calendarId }],
                },
            });
            const googleBusy = res.data.calendars?.[calendarId]?.busy ?? [];
            busy.push(...googleBusy.map(b => ({ start: b.start!, end: b.end! })));
        } catch (err) {
            console.warn(`[calendar/getBusySlots] Google error:`, (err as any).message);
        }
    } else if (provider === "MICROSOFT") {
        try {
            const token = await getAuthenticatedMicrosoftClient(clientId, db);
            const madridOffset = getMadridOffset(date);
            const startOfDay = new Date(new Date(`${date}T00:00:00Z`).getTime() - madridOffset * 3600000);
            const endOfDay = new Date(new Date(`${date}T23:59:59Z`).getTime() - madridOffset * 3600000);

            const res = await fetch("https://graph.microsoft.com/v1.0/me/calendar/getSchedule", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Prefer": `outlook.timezone="Europe/Madrid"`
                },
                body: JSON.stringify({
                    schedules: ["primary"],
                    startTime: { dateTime: startOfDay.toISOString(), timeZone: "UTC" },
                    endTime: { dateTime: endOfDay.toISOString(), timeZone: "UTC" },
                    availabilityViewInterval: 30
                })
            });
            const data = await res.json();
            const scheduleData = data.value?.[0];
            if (scheduleData?.scheduleItems) {
                scheduleData.scheduleItems.forEach((item: any) => {
                    busy.push({
                        start: item.start.dateTime,
                        end: item.end.dateTime
                    });
                });
            }
        } catch (err) {
            console.warn(`[calendar/getBusySlots] Microsoft error:`, (err as any).message);
        }
    } else if (provider === "ICAL") {
        if (client.icalUrl) {
            const iCalBusy = await fetchICalBusySlots(client.icalUrl, date);
            busy.push(...iCalBusy);
        }
    } else if (provider === "PMS") {
        try {
            const connector = await getPMSConnector(client.pmsProvider, client);
            if (connector) {
                const pmsBusy = await connector.getBusySlots(date);
                busy.push(...pmsBusy);
            }
        } catch (err) {
            console.warn(`[calendar/getBusySlots] PMS error:`, (err as any).message);
        }
    }

    // --- 2. Secondary Sync Sources (CRM, Restaurant) ---
    // Even if Google/PMS is primary, we check others to detect manual entries
    
    // CRM Check
    if (client.crmActive && provider !== "GOOGLE" && provider !== "MICROSOFT") { // Basic rule to avoid redundant checks if CRM is integrated with calendar
        try {
            const crm = getCRMConnector(client.crmProvider, client);
            if (crm && crm.getBusySlots) {
                const crmBusy = await crm.getBusySlots(date);
                busy.push(...crmBusy);
            }
        } catch (err) {
            console.warn(`[calendar/getBusySlots] CRM Federated check failed`, (err as any).message);
        }
    }

    // Restaurant Check
    if (client.restaurantActive) {
        try {
            const restaurant = getRestaurantConnector(client);
            if (restaurant && (restaurant as any).getBusySlots) {
                const resBusy = await (restaurant as any).getBusySlots(date);
                busy.push(...resBusy);
            }
        } catch (err) {
             console.warn(`[calendar/getBusySlots] Restaurant Federated check failed`, (err as any).message);
        }
    }

    return busy;
}

function getMadridOffset(date: string) {
    return new Date(`${date}T12:00:00`).toLocaleString('en-US', { timeZone: 'Europe/Madrid', hour12: false, hour: '2-digit', minute: '2-digit' }) ===
        new Date(`${date}T12:00:00`).toLocaleString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit' })
        ? 0 : parseInt(new Date(`${date}T12:00:00`).toLocaleString('en-US', { timeZone: 'Europe/Madrid', hour12: false, hour: '2-digit' })) -
        parseInt(new Date(`${date}T12:00:00`).toLocaleString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit' }));
}

async function getAuthenticatedGoogleClient(clientId: string, db: any, staffCalendarId?: string) {
    const client = await db.client.findUnique({
        where: { id: clientId },
        select: {
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true,
            calendarId: true,
            businessName: true
        },
    });

    const oAuth2Client = getOAuthClient();

    // 1. Check if client has their own connection
    if (client?.googleAccessToken) {
        oAuth2Client.setCredentials({
            access_token: client.googleAccessToken,
            refresh_token: client.googleRefreshToken ?? undefined,
            expiry_date: client.googleTokenExpiry?.getTime(),
        });
        return { oAuth2Client, calendarId: staffCalendarId || client.calendarId || "primary" };
    }

    // 2. FALLBACK: Use CitaLiks Master Account (Master Calendar Architecture)
    // We expect MASTER_GOOGLE_REFRESH_TOKEN in env
    const masterRefreshToken = process.env.MASTER_GOOGLE_REFRESH_TOKEN;
    if (!masterRefreshToken) {
        throw new Error("Google not connected and Master Account not configured");
    }

    oAuth2Client.setCredentials({
        refresh_token: masterRefreshToken
    });

    // If client doesn't have a calendarId, we should ideally create one on the master account
    // For now, if missing, we'll try to find or create a calendar named after instructions
    let targetCalendarId = client?.calendarId;

    if (!targetCalendarId || targetCalendarId === "primary") {
        try {
            const calendarSvc = google.calendar({ version: "v3", auth: oAuth2Client });
            const list = await calendarSvc.calendarList.list();
            const existing = list.data.items?.find(c => c.summary === `CitaLiks: ${client?.businessName || clientId}`);
            
            if (existing) {
                targetCalendarId = existing.id!;
            } else {
                console.log(`[Calendar/Master] Creating dedicated calendar for ${client?.businessName}`);
                const created = await calendarSvc.calendars.insert({
                    requestBody: { summary: `CitaLiks: ${client?.businessName || clientId}` }
                });
                targetCalendarId = created.data.id!;
            }

            // Save this calendarId for future use (even if it's on the master account)
            await db.client.update({
                where: { id: clientId },
                data: { calendarId: targetCalendarId }
            });
        } catch (err) {
            console.error("[Calendar/Master] Error managing master calendar:", (err as any).message);
            targetCalendarId = "primary"; // Fallback to master's primary if creation fails
        }
    }

    return { oAuth2Client, calendarId: staffCalendarId || targetCalendarId };
}

export interface TimeSlot {
    start: string;
    end: string;
}

export async function checkAvailability(
    clientId: string,
    date: string,
    durationMin: number = 30,
    params?: {
        staffCalendarId?: string;
        prismaOverride?: any;
        stepMin?: number;
    }
): Promise<TimeSlot[]> {
    const db = params?.prismaOverride || prisma;
    const clientInfo = await db.client.findUnique({
        where: { id: clientId },
        select: { activeCalendarProvider: true }
    });

    const busy = await getBusySlots(clientId, date, clientInfo?.activeCalendarProvider || "GOOGLE", db, params);

    let localAppointments: any[] = await (db as any).appointment.findMany({
        where: { clientId, date, status: "CONFIRMED" }
    });

    localAppointments.forEach((apt: any) => {
        const [h, m] = apt.time.split(':').map(Number);
        const startMin = h * 60 + m;
        const endMin = startMin + durationMin;
        busy.push({
            start: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            end: `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
        });
    });

    const dbClient = await db.client.findUnique({
        where: { id: clientId },
        include: { schedules: true },
    });

    const dateObj = new Date(`${date}T12:00:00Z`);
    const dayOfWeek = (dateObj.getUTCDay() + 6) % 7;
    const schedule = dbClient?.schedules.find((s: any) => !s.staffId && s.dayOfWeek === dayOfWeek && s.isOpen);

    if (!schedule) return [];

    const slots: TimeSlot[] = [];
    const [openH, openM] = schedule.openTime.split(':').map(Number);
    const [closeH, closeM] = schedule.closeTime.split(':').map(Number);

    let currentMin = openH * 60 + openM;
    const endMin = closeH * 60 + closeM;

    while (currentMin + durationMin <= endMin) {
        const slotEndMin = currentMin + durationMin;
        const h = String(Math.floor(currentMin / 60)).padStart(2, '0');
        const m = String(currentMin % 60).padStart(2, '0');
        const slotStartStr = `${h}:${m}`;

        const isOccupied = busy.some((b) => {
            let bStartMin, bEndMinVal;
            if (b.start.includes('T')) {
                const bStartDate = new Date(b.start);
                bStartMin = bStartDate.getHours() * 60 + bStartDate.getMinutes();
                const bEndDate = new Date(b.end);
                bEndMinVal = bEndDate.getHours() * 60 + bEndDate.getMinutes();
            } else {
                const [bsh, bsm] = b.start.split(':').map(Number);
                const [beh, bem] = b.end.split(':').map(Number);
                bStartMin = bsh * 60 + bsm;
                bEndMinVal = beh * 60 + bem;
            }
            return currentMin < bEndMinVal && slotEndMin > bStartMin;
        });

        if (!isOccupied) {
            slots.push({ start: slotStartStr, end: `${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}` });
        }
        currentMin += params?.stepMin || 30;
    }

    return slots;
}

export async function bookAppointment(params: {
    clientId: string;
    callerName: string;
    callerPhone?: string;
    serviceName: string;
    staffName?: string;
    date: string;
    time: string;
    durationMin?: number;
    prismaOverride?: any;
    notes?: string;
    staffCalendarId?: string;
}) {
    const db = params.prismaOverride || prisma;
    const durationMin = params.durationMin || 30;

    const available = await checkAvailability(params.clientId, params.date, durationMin, { prismaOverride: db });
    if (!available.some(s => s.start === params.time.substring(0, 5))) {
        return { eventId: "", confirmed: false, error: "Slot no disponible" };
    }

    const localApt = await (db as any).appointment.create({
        data: {
            clientId: params.clientId,
            callerName: params.callerName,
            callerPhone: params.callerPhone || null,
            serviceName: params.serviceName,
            date: params.date,
            time: params.time.substring(0, 5),
            status: "CONFIRMED"
        }
    });

    const client = await db.client.findUnique({
        where: { id: params.clientId },
        select: { 
            activeCalendarProvider: true, 
            googleAccessToken: true, 
            microsoftAccessToken: true, 
            pmsProvider: true, 
            pmsApiKey: true, 
            pmsUrl: true,
            crmActive: true,
            crmProvider: true,
            crmApiKey: true,
            crmUrl: true,
            crmClientId: true,
            crmClientSecret: true,
            crmRefreshToken: true
        }
    });

    let externalId: string | null = null;

    // 1. Sync with Calendar Providers (Independent blocks for "Dual Sync" support)
    
    // --- Google Calendar Sync ---
    if (client?.activeCalendarProvider === "GOOGLE" || (client?.googleAccessToken)) {
        try {
            const { oAuth2Client, calendarId: gCalId } = await getAuthenticatedGoogleClient(params.clientId, db);
            const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

            const startDateTime = `${params.date}T${params.time.substring(0, 5)}:00`;
            const endDateTime = new Date(new Date(startDateTime).getTime() + durationMin * 60000).toISOString();

            const res = await calendar.events.insert({
                calendarId: gCalId,
                requestBody: {
                    summary: `${params.serviceName} - ${params.callerName}`,
                    description: `Cita agendada por CitaLiks.\nServicio: ${params.serviceName}\nCliente: ${params.callerName}\nTeléfono: ${params.callerPhone || 'No indicado'}`,
                    start: { dateTime: startDateTime, timeZone: 'Europe/Madrid' },
                    end: { dateTime: endDateTime, timeZone: 'Europe/Madrid' }
                }
            });
            const gId = res.data.id || null;
            if (gId) {
                externalId = gId; // Primary ID if Google is used
                console.log(`[calendar/bookAppointment] Google sync success: ${gId}`);
            }
        } catch (err) {
            console.warn("[calendar/bookAppointment] Google sync failed", (err as any).message);
        }
    }

    // --- Microsoft Outlook Sync ---
    if (client?.activeCalendarProvider === "MICROSOFT" || (client?.microsoftAccessToken)) {
        try {
            const token = await getAuthenticatedMicrosoftClient(params.clientId, db);
            const startDateTime = `${params.date}T${params.time.substring(0, 5)}:00`;
            const endDateTime = new Date(new Date(startDateTime).getTime() + durationMin * 60000).toISOString();

            const res = await fetch("https://graph.microsoft.com/v1.0/me/calendar/events", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    subject: `Cita: ${params.callerName} (${params.serviceName})`,
                    body: {
                        contentType: "HTML",
                        content: `Cita agendada por CitaLiks.<br>Servicio: ${params.serviceName}<br>Cliente: ${params.callerName}<br>Teléfono: ${params.callerPhone || 'No indicado'}`
                    },
                    start: { dateTime: startDateTime, timeZone: "Europe/Madrid" },
                    end: { dateTime: endDateTime, timeZone: "Europe/Madrid" }
                })
            });
            const event = await res.json();
            if (event.id) {
                if (!externalId) externalId = event.id;
                console.log(`[calendar/bookAppointment] Microsoft sync success: ${event.id}`);
            }
        } catch (err) {
            console.warn("[calendar/bookAppointment] Microsoft sync failed", (err as any).message);
        }
    }

    // 2. Dispatch Secondary Syncs (Non-blocking for the bot)
    // This allows the bot to respond immediately once the "Master" is confirmed
    dispatchSecondarySyncs({
        client,
        params,
        localAptId: localApt.id,
        db
    }).catch(err => console.error("[calendar/book] Dispatch error:", err));

    return { eventId: localApt.id, confirmed: true };
}

/**
 * Handles all secondary integrations (CRM, PMS, Webhooks) 
 * after the master calendar is confirmed.
 */
async function dispatchSecondarySyncs(ctx: { client: any, params: any, localAptId: string, db: any }) {
    const { client, params, localAptId, db } = ctx;
    let externalId: string | null = null;
    const durationMin = params.durationMin || 30;

    // --- PMS Sync ---
    if (client?.activeCalendarProvider === "PMS" || client?.pmsActive) {
        try {
            const connector = await getPMSConnector(client.pmsProvider, client);
            if (connector) {
                const result = await connector.createAppointment({
                    name: params.callerName,
                    phone: params.callerPhone || "",
                    date: params.date,
                    time: params.time,
                    service: params.serviceName
                });
                if (result.id) externalId = result.id;
            }
        } catch (err) {
            console.warn("[sync/PMS] Failed", (err as any).message);
        }
    }

    if (externalId) {
        await (db as any).appointment.update({ where: { id: localAptId }, data: { externalId } });
    }

    // --- CRM / Webhook Sync ---
    if (client?.crmActive && params.callerPhone) {
        try {
            const crm = getCRMConnector(client.crmProvider, client);
            if (crm) {
                const contact = await crm.createOrUpdateContact({
                    name: params.callerName,
                    phone: params.callerPhone,
                });
                if (contact) {
                    await crm.logActivity({
                        contactId: contact.id,
                        type: 'APPOINTMENT',
                        details: `Cita agendada: ${params.serviceName} para el ${params.date} a las ${params.time}`
                    });
                }
            }
        } catch (crmErr) {
            console.warn("[sync/CRM] Failed", (crmErr as any).message);
        }
    }
}

export async function cancelAppointment(params: {
    clientId: string;
    appointmentId?: string; // Optional: can search by other criteria
    callerName?: string;
    callerPhone?: string;
    date?: string;
    time?: string;
    prismaOverride?: any;
}) {
    const db = params.prismaOverride || prisma;
    let appointment;

    if (params.appointmentId) {
        appointment = await (db as any).appointment.findUnique({ where: { id: params.appointmentId } });
    } else {
        // Find by criteria (latest confirmed appointment for this person/day)
        appointment = await (db as any).appointment.findFirst({
            where: {
                clientId: params.clientId,
                callerName: params.callerName,
                date: params.date,
                time: params.time,
                status: "CONFIRMED"
            },
            orderBy: { createdAt: 'desc' }
        });

        // Try searching by phone if name didn't work
        if (!appointment && (params.callerPhone || params.callerName)) {
            appointment = await (db as any).appointment.findFirst({
                where: {
                    clientId: params.clientId,
                    date: params.date,
                    status: "CONFIRMED",
                    OR: [
                        { callerPhone: params.callerPhone },
                        { callerName: params.callerName }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });
        }
    }

    if (!appointment) throw new Error("Cita no encontrada");

    const client = await db.client.findUnique({
        where: { id: params.clientId },
        select: { activeCalendarProvider: true }
    });

    if (appointment.externalId) {
        if (client?.activeCalendarProvider === "GOOGLE") {
            try {
                const { oAuth2Client, calendarId } = await getAuthenticatedGoogleClient(params.clientId, db);
                const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
                await calendar.events.delete({ calendarId, eventId: appointment.externalId });
            } catch (err) {
                console.warn("[calendar/cancel] Google delete failed", (err as any).message);
            }
        } else if (client?.activeCalendarProvider === "MICROSOFT") {
            try {
                const token = await getAuthenticatedMicrosoftClient(params.clientId, db);
                await fetch(`https://graph.microsoft.com/v1.0/me/calendar/events/${appointment.externalId}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });
            } catch (err) {
                console.warn("[calendar/cancel] Microsoft delete failed", (err as any).message);
            }
        }
    }

    await (db as any).appointment.update({
        where: { id: appointment.id },
        data: { status: "CANCELLED" }
    });

    return { cancelled: true, message: "Cita cancelada correctamente" };
}

export async function listEvents(clientId: string, params?: any) {
    // Basic local list
    const db = params?.prismaOverride || prisma;
    return await (db as any).appointment.findMany({
        where: { clientId, status: "CONFIRMED" },
        orderBy: { date: 'desc' }
    });
}
