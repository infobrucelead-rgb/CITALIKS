import { google } from "googleapis";
import { prisma } from "./db";

function getOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

export function getGoogleAuthUrl(clientId: string): string {
    const oAuth2Client = getOAuthClient();
    return oAuth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: ["https://www.googleapis.com/auth/calendar"],
        state: clientId, // Pass clientId so we know which client authenticated
    });
}

export async function exchangeCodeForTokens(
    code: string,
    clientId: string
): Promise<void> {
    const oAuth2Client = getOAuthClient();
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

async function getAuthenticatedClient(clientId: string, prismaOverride?: any, staffCalendarId?: string) {
    const db = prismaOverride || prisma;
    const client = await db.client.findUnique({
        where: { id: clientId },
        select: {
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true,
            calendarId: true,
        },
    });

    if (!client?.googleAccessToken) {
        throw new Error(`Cliente ${clientId} no tiene Google Calendar conectado`);
    }

    const oAuth2Client = getOAuthClient();
    oAuth2Client.setCredentials({
        access_token: client.googleAccessToken,
        refresh_token: client.googleRefreshToken ?? undefined,
        expiry_date: client.googleTokenExpiry?.getTime(),
    });

    // Proactive refresh if expired or about to expire (within 5 mins)
    const expiryDate = client.googleTokenExpiry?.getTime() || 0;
    const now = Date.now();

    if (client.googleRefreshToken && (expiryDate === 0 || now > expiryDate - 5 * 60 * 1000)) {
        console.log(`[calendar/getAuthenticatedClient] Token expired or close to expiry. Forcing refresh.`);
        try {
            const { credentials } = await oAuth2Client.refreshAccessToken();
            if (credentials.access_token) {
                await db.client.update({
                    where: { id: clientId },
                    data: {
                        googleAccessToken: credentials.access_token,
                        googleTokenExpiry: credentials.expiry_date
                            ? new Date(credentials.expiry_date)
                            : undefined,
                    },
                });
                oAuth2Client.setCredentials(credentials);
            }
        } catch (err) {
            console.error(`[calendar/getAuthenticatedClient] Failed to refresh token:`, err);
            // We continue, maybe the current token still works or the error will be caught later
        }
    }

    oAuth2Client.on("tokens", async (tokens) => {
        if (tokens.access_token) {
            await db.client.update({
                where: { id: clientId },
                data: {
                    googleAccessToken: tokens.access_token,
                    googleTokenExpiry: tokens.expiry_date
                        ? new Date(tokens.expiry_date)
                        : undefined,
                },
            });
        }
    });

    return { oAuth2Client, calendarId: staffCalendarId || client.calendarId || "primary" };
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
    }
): Promise<TimeSlot[]> {
    const db = params?.prismaOverride || prisma;
    const staffCalendarId = params?.staffCalendarId;
    const busy: { start: string, end: string }[] = [];

    // 1. Get Busy periods from Google (if connected)
    try {
        const { oAuth2Client, calendarId } = await getAuthenticatedClient(clientId, db, staffCalendarId);
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);

        const res = await calendar.freebusy.query({
            requestBody: {
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                items: [{ id: calendarId }],
            },
        });

        const googleBusy = res.data.calendars?.[calendarId]?.busy ?? [];
        busy.push(...googleBusy.map(b => ({ start: b.start!, end: b.end! })));
        console.log(`[calendar/checkAvailability] Found ${googleBusy.length} Google busy periods`);
    } catch (err) {
        console.warn(`[calendar/checkAvailability] skipping Google Calendar:`, (err as any).message);
    }

    // 2. Get Busy periods from Local Database
    const activePrisma = params?.prismaOverride || prisma;
    const appointmentModel = (activePrisma as any).appointment || (activePrisma as any).Appointment;
    const localAppointments = appointmentModel
        ? await appointmentModel.findMany({
            where: {
                clientId,
                date,
                status: "CONFIRMED"
            }
        })
        : [];

    localAppointments.forEach((apt: any) => {
        const start = new Date(`${apt.date}T${apt.time}:00`);
        const end = new Date(start.getTime() + durationMin * 60_000);
        busy.push({
            start: start.toISOString(),
            end: end.toISOString()
        });
    });
    console.log(`[calendar/checkAvailability] Found ${localAppointments.length} Local busy periods`);

    console.log(`[calendar/checkAvailability] Total busy periods for ${date}:`, busy.length);
    if (busy.length > 0) {
        console.log(`[calendar/checkAvailability] Busy details:`, busy.map(b => `${new Date(b.start).toLocaleTimeString()} - ${new Date(b.end).toLocaleTimeString()}`).join(', '));
    }

    const dbClient = await db.client.findUnique({
        where: { id: clientId },
        include: { schedules: true },
    });

    const dateObj = new Date(`${date}T12:00:00`);
    const dayOfWeek = (dateObj.getDay() + 6) % 7; // 0=Mon, 6=Sun

    // CRITICAL FIX: Only look at business-wide schedules (staffId=null)
    // Staff-specific schedules apply to their personal calendar, not the business hours
    const businessSchedules = (dbClient?.schedules || []).filter((s: any) => !s.staffId);
    const schedule = businessSchedules.find((s: any) => s.dayOfWeek === dayOfWeek && s.isOpen);

    console.log(`[calendar/checkAvailability] Day index: ${dayOfWeek}, Business schedules for this day:`,
        (dbClient?.schedules || []).filter((s: any) => s.dayOfWeek === dayOfWeek).map((s: any) =>
            `staffId=${s.staffId || 'null'} ${s.isOpen ? `OPEN ${s.openTime}-${s.closeTime}` : 'CLOSED'}`
        ).join(' | ')
    );
    console.log(`[calendar/checkAvailability] Using schedule:`, schedule ? `OPEN ${schedule.openTime}-${schedule.closeTime}` : 'CLOSED/NONE');

    if (!schedule) {
        console.log(`[calendar/checkAvailability] Day ${dayOfWeek} is CLOSED for client ${clientId}`);
        return [];
    }

    const slots: TimeSlot[] = [];
    // TIMEZONE FIX: Force time parsing as local Spanish time (Europe/Madrid = UTC+1)
    // by using a Date with explicit offset or just parsing hours/minutes directly
    const [openH, openM] = schedule.openTime.split(':').map(Number);
    const [closeH, closeM] = schedule.closeTime.split(':').map(Number);
    let currentMin = openH * 60 + openM;
    const endMin = closeH * 60 + closeM;

    while (currentMin < endMin) {
        const slotEndMin = currentMin + durationMin;
        if (slotEndMin > endMin) break;

        const slotStart = new Date(`${date}T${String(Math.floor(currentMin / 60)).padStart(2, '0')}:${String(currentMin % 60).padStart(2, '0')}:00`);
        const slotEnd = new Date(`${date}T${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}:00`);

        const isOccupied = busy.some((b) => {
            const bStart = new Date(b.start);
            const bEnd = new Date(b.end);
            return slotStart < bEnd && slotEnd > bStart;
        });

        const h = String(Math.floor(currentMin / 60)).padStart(2, '0');
        const m = String(currentMin % 60).padStart(2, '0');
        const eh = String(Math.floor(slotEndMin / 60)).padStart(2, '0');
        const em = String(slotEndMin % 60).padStart(2, '0');

        if (!isOccupied) {
            slots.push({ start: `${h}:${m}`, end: `${eh}:${em}` });
        }

        currentMin = slotEndMin;
    }

    console.log(`[calendar/checkAvailability] Generated ${slots.length} free slots`);
    return slots;
}

export async function bookAppointment(params: {
    clientId: string;
    callerName: string;
    callerPhone?: string;
    serviceName: string;
    date: string;
    time: string;
    notes?: string;
    durationMin?: number;
    prismaOverride?: any;
    staffCalendarId?: string;
    staffName?: string;
}): Promise<{ eventId: string; confirmed: boolean; error?: string }> {
    const activePrisma = params.prismaOverride || prisma;

    // 1. SAFETY CHECK: Re-verify availability
    const available = await checkAvailability(
        params.clientId,
        params.date,
        params.durationMin || 30,
        {
            staffCalendarId: params.staffCalendarId,
            prismaOverride: activePrisma
        }
    );

    const isSlotFree = available.some(s => s.start === params.time);
    if (!isSlotFree) {
        return { eventId: "", confirmed: false, error: "Slot no disponible" };
    }

    // 2. SAVE LOCALLY (This is the source of truth)
    const appointmentModel = (activePrisma as any).appointment || (activePrisma as any).Appointment;
    if (!appointmentModel) {
        const availableModels = Object.keys(activePrisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
        console.error(`[calendar/bookAppointment] Models in activePrisma:`, availableModels);
        return {
            eventId: "",
            confirmed: false,
            error: `Database not ready (model missing). Models found: ${availableModels.join(', ')}`
        };
    }
    const localApt = await appointmentModel.create({
        data: {
            clientId: params.clientId,
            callerName: params.callerName,
            callerPhone: params.callerPhone,
            serviceName: params.serviceName,
            staffName: params.staffName,
            date: params.date,
            time: params.time,
            notes: params.notes,
        }
    });

    console.log(`[calendar/bookAppointment] Local appointment created: ${localApt.id}`);

    // 3. SYNC TO GOOGLE (Best effort)
    let externalId: string | undefined = undefined;
    try {
        const { oAuth2Client, calendarId } = await getAuthenticatedClient(
            params.clientId,
            activePrisma,
            params.staffCalendarId
        );
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

        const start = new Date(`${params.date}T${params.time}:00`);
        const end = new Date(start.getTime() + (params.durationMin ?? 30) * 60_000);

        const event = await calendar.events.insert({
            calendarId,
            requestBody: {
                summary: `${params.serviceName} — ${params.callerName}`,
                description: params.notes || "Cita registrada por Cita Liks",
                start: { dateTime: start.toISOString() },
                end: { dateTime: end.toISOString() },
            },
        });

        externalId = event.data.id ?? undefined;
        if (externalId) {
            await (activePrisma.appointment as any).update({
                where: { id: localApt.id },
                data: { externalId }
            });
            console.log(`[calendar/bookAppointment] Synced to Google: ${externalId}`);
        }
    } catch (err) {
        console.warn(`[calendar/bookAppointment] Google Sync failed (local booking stands):`, (err as any).message);
    }

    return { eventId: localApt.id, confirmed: true };
}

export async function cancelAppointment(params: {
    clientId: string;
    callerName: string;
    date: string;
    time?: string;
    prismaOverride?: any;
    staffCalendarId?: string;
}): Promise<{ cancelled: boolean; message: string }> {
    const db = params.prismaOverride || prisma;
    const { oAuth2Client, calendarId } = await getAuthenticatedClient(
        params.clientId,
        db,
        params.staffCalendarId
    );
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const timeMin = new Date(`${params.date}T00:00:00`);
    const timeMax = new Date(`${params.date}T23:59:59`);

    const res = await calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        q: params.callerName,
        singleEvents: true,
    });

    const events = res.data.items ?? [];
    if (events.length === 0) {
        return { cancelled: false, message: "No se encontró ninguna cita para esa fecha" };
    }

    const eventToCancel = events[0];
    await calendar.events.delete({
        calendarId,
        eventId: eventToCancel.id!,
    });

    return { cancelled: true, message: `Cita del ${params.date} cancelada correctamente` };
}
export async function listEvents(clientId: string, params?: { staffCalendarId?: string; staffName?: string; prismaOverride?: any }) {
    const db = params?.prismaOverride || prisma;
    const staffCalendarId = params?.staffCalendarId;
    const staffName = params?.staffName;

    const allEvents: any[] = [];

    // 1. Get Google Events
    try {
        const { oAuth2Client, calendarId } = await getAuthenticatedClient(clientId, db, staffCalendarId);
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

        const now = new Date();
        const res = await calendar.events.list({
            calendarId,
            timeMin: now.toISOString(),
            maxResults: 20,
            singleEvents: true,
            orderBy: 'startTime',
        });

        if (res.data.items) {
            allEvents.push(...res.data.items.map(e => ({
                id: `google-${e.id}`,
                summary: e.summary,
                start: e.start,
                end: e.end,
                source: 'google'
            })));
        }
    } catch (err) {
        console.warn(`[calendar/listEvents] Skipping Google:`, (err as any).message);
    }

    // 2. Get Local Appointments
    try {
        const appointmentModel = (db as any).appointment || (db as any).Appointment;
        if (appointmentModel) {
            const localApts = await appointmentModel.findMany({
                where: {
                    clientId,
                    staffName: staffName || undefined,
                    status: "CONFIRMED",
                    date: { gte: new Date().toISOString().split('T')[0] }
                },
                orderBy: [{ date: 'asc' }, { time: 'asc' }],
                take: 20
            });

            allEvents.push(...localApts.map((a: any) => ({
                id: `local-${a.id}`,
                summary: a.serviceName,
                start: { dateTime: new Date(`${a.date}T${a.time}:00`).toISOString() },
                end: { dateTime: new Date(new Date(`${a.date}T${a.time}:00`).getTime() + 30 * 60_000).toISOString() },
                source: 'local',
                metadata: {
                    callerName: a.callerName,
                    callerPhone: a.callerPhone,
                    serviceName: a.serviceName,
                    notes: a.notes,
                    status: a.status
                }
            })));
        }
    } catch (err) {
        console.error(`[calendar/listEvents] Local fetch failed:`, err);
    }

    // Sort by start time
    return allEvents.sort((a, b) => {
        const t1 = new Date(a.start.dateTime || a.start.date).getTime();
        const t2 = new Date(b.start.dateTime || b.start.date).getTime();
        return t1 - t2;
    });
}
