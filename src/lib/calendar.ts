import { google } from "googleapis";
import { prisma } from "./db";

// Allow passing a dynamic redirectUri to override the environment variable
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
        prompt: "consent",
        scope: ["https://www.googleapis.com/auth/calendar"],
        state: clientId,
    });
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

export async function listGoogleCalendars(clientId: string, prismaOverride?: any) {
    try {
        const { oAuth2Client } = await getAuthenticatedClient(clientId, prismaOverride);
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
        const res = await calendar.calendarList.list();
        return res.data.items || [];
    } catch (err) {
        console.error("[calendar/listGoogleCalendars] Error fetching calendars:", err);
        return [];
    }
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
        stepMin?: number; // The interval between offered start times (def: 30)
    }
): Promise<TimeSlot[]> {
    // 0. QUICK CHECK: Prevent searching in the past
    // Using simple YYYY-MM-DD string comparison works because format is strictly lexically sortable
    const todayLocal = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
    if (date < todayLocal) {
        console.warn(`[calendar/checkAvailability] Rejected past date lookup: ${date} (today is ${todayLocal})`);
        return []; // No availability in the past
    }

    const db = params?.prismaOverride || prisma;
    const staffCalendarId = params?.staffCalendarId;
    const busy: { start: string, end: string }[] = [];

    // 1. Get Busy periods from Google (if connected) — best effort, never blocks
    try {
        const { oAuth2Client, calendarId } = await getAuthenticatedClient(clientId, db, staffCalendarId);
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

        // Use Europe/Madrid timezone boundaries for freebusy query
        // CET is UTC+1 (winter) / UTC+2 (summer). Madrid midnight is at UTC-1 or UTC-2,
        // so querying from UTC midnight would miss events booked at 0:00 local time.
        const madridOffset = new Date(`${date}T12:00:00`).toLocaleString('en-US', { timeZone: 'Europe/Madrid', hour12: false, hour: '2-digit', minute: '2-digit' }) ===
            new Date(`${date}T12:00:00`).toLocaleString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit' })
            ? 0 : parseInt(new Date(`${date}T12:00:00`).toLocaleString('en-US', { timeZone: 'Europe/Madrid', hour12: false, hour: '2-digit' })) -
            parseInt(new Date(`${date}T12:00:00`).toLocaleString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit' }));
        const offsetMs = madridOffset * 3600000;
        const startOfDay = new Date(new Date(`${date}T00:00:00Z`).getTime() - offsetMs);
        const endOfDay = new Date(new Date(`${date}T23:59:59Z`).getTime() - offsetMs);
        console.log(`[calendar/checkAvailability] freebusy query: ${startOfDay.toISOString()} → ${endOfDay.toISOString()} (Madrid offset: +${madridOffset}h)`);

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
        // Google Calendar not connected or token expired — continue with local DB only
        console.warn(`[calendar/checkAvailability] Skipping Google Calendar (not connected or error):`, (err as any).message);
    }

    // 2. Get Busy periods from Local Database
    const activePrisma = params?.prismaOverride || prisma;

    // FIX: Prisma model name is lowercase 'appointment' — use direct access, not dynamic lookup
    let localAppointments: any[] = [];
    try {
        localAppointments = await (activePrisma as any).appointment.findMany({
            where: {
                clientId,
                date,
                status: "CONFIRMED"
            }
        });
    } catch (err) {
        console.warn(`[calendar/checkAvailability] Could not fetch local appointments:`, (err as any).message);
    }

    localAppointments.forEach((apt: any) => {
        // FIX: Parse time as local time, not UTC, to avoid timezone shift
        const [h, m] = apt.time.split(':').map(Number);
        const startMin = h * 60 + m;
        const endMin = startMin + durationMin;
        // Store as simple HH:MM strings for comparison with slot strings
        busy.push({
            start: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            end: `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
        });
    });
    console.log(`[calendar/checkAvailability] Found ${localAppointments.length} Local busy periods`);

    // 3. Get business schedule for the requested day
    const dbClient = await db.client.findUnique({
        where: { id: clientId },
        include: { schedules: true },
    });

    // FIX: Use UTC noon to avoid day-boundary issues with getDay()
    const dateObj = new Date(`${date}T12:00:00Z`);
    const dayOfWeek = (dateObj.getUTCDay() + 6) % 7; // 0=Mon, 6=Sun

    const businessSchedules = (dbClient?.schedules || []).filter((s: any) => !s.staffId);
    const schedule = businessSchedules.find((s: any) => s.dayOfWeek === dayOfWeek && s.isOpen);

    console.log(`[calendar/checkAvailability] Day index (UTC): ${dayOfWeek}, schedule: ${schedule ? `OPEN ${schedule.openTime}-${schedule.closeTime}` : 'CLOSED/NONE'}`);

    if (!schedule) {
        console.log(`[calendar/checkAvailability] Day ${dayOfWeek} is CLOSED for client ${clientId}`);
        return [];
    }

    // 4. Generate free slots
    const slots: TimeSlot[] = [];
    const [openH, openM] = schedule.openTime.split(':').map(Number);
    const [closeH, closeM] = schedule.closeTime.split(':').map(Number);

    // stepMin is the interval between start times of offered slots
    // durationMin is the length of the service booked
    const stepMin = params?.stepMin || 30;

    let currentMin = openH * 60 + openM;
    const endMin = closeH * 60 + closeM;

    // FIX: If the requested date is TODAY, skip slots that are already in the past.
    // Use local time (not UTC) to determine the current time.
    // Add a 15-minute buffer so the bot never offers a slot that starts in less than 15 min.
    if (date === todayLocal) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes() + 15; // +15 min buffer
        if (nowMinutes > currentMin) {
            // Round up to the next step boundary
            const slotsToSkip = Math.ceil((nowMinutes - currentMin) / stepMin);
            currentMin += slotsToSkip * stepMin;
            console.log(`[calendar/checkAvailability] Today: skipping past slots, starting from ${String(Math.floor(currentMin / 60)).padStart(2, '0')}:${String(currentMin % 60).padStart(2, '0')} (now+15min buffer)`);
        }
    }

    while (currentMin + durationMin <= endMin) {
        const slotEndMin = currentMin + durationMin;

        const h = String(Math.floor(currentMin / 60)).padStart(2, '0');
        const m = String(currentMin % 60).padStart(2, '0');
        const eh = String(Math.floor(slotEndMin / 60)).padStart(2, '0');
        const em = String(slotEndMin % 60).padStart(2, '0');
        const slotStartStr = `${h}:${m}`;
        const slotEndStr = `${eh}:${em}`;

        // FIX: Compare local time strings directly (HH:MM) instead of mixing Date objects with ISO strings
        // This avoids the UTC vs local timezone mismatch that caused all slots to appear free even when occupied
        const isOccupied = busy.some((b) => {
            // For local DB busy slots, b.start and b.end are already HH:MM strings
            // For Google Calendar busy slots, b.start and b.end are ISO strings — convert them
            let bStartStr: string;
            let bEndStr: string;

            if (b.start.includes('T') || b.start.includes('Z')) {
                // ISO string from Google Calendar — extract local time
                const bStartDate = new Date(b.start);
                bStartStr = `${String(bStartDate.getHours()).padStart(2, '0')}:${String(bStartDate.getMinutes()).padStart(2, '0')}`;
                const bEndDate = new Date(b.end);
                bEndStr = `${String(bEndDate.getHours()).padStart(2, '0')}:${String(bEndDate.getMinutes()).padStart(2, '0')}`;
            } else {
                // Already HH:MM from local DB
                bStartStr = b.start;
                bEndStr = b.end;
            }

            // Convert to minutes for overlap check
            const [bsh, bsm] = bStartStr.split(':').map(Number);
            const [beh, bem] = bEndStr.split(':').map(Number);
            const bStartMin = bsh * 60 + bsm;
            const bEndMinVal = beh * 60 + bem;

            return currentMin < bEndMinVal && slotEndMin > bStartMin;
        });

        if (!isOccupied) {
            slots.push({ start: slotStartStr, end: slotEndStr });
        }

        // Increment by stepMin instead of durationMin to offer more flexible start times
        currentMin += stepMin;
    }

    console.log(`[calendar/checkAvailability] Generated ${slots.length} free slots for ${date}`);
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
    const durationMin = params.durationMin || 30;

    // 1. SAFETY CHECK: Re-verify availability
    const available = await checkAvailability(
        params.clientId,
        params.date,
        durationMin,
        {
            staffCalendarId: params.staffCalendarId,
            prismaOverride: activePrisma
        }
    );

    // FIX: Normalize time comparison — strip seconds if present (e.g. "09:00:00" -> "09:00")
    const normalizedTime = params.time.substring(0, 5);
    const isSlotFree = available.some(s => s.start === normalizedTime);

    if (!isSlotFree) {
        console.warn(`[calendar/bookAppointment] Slot ${normalizedTime} not in available slots:`, available.map(s => s.start));
        return { eventId: "", confirmed: false, error: `Slot ${normalizedTime} no disponible. Slots libres: ${available.slice(0, 5).map(s => s.start).join(', ')}` };
    }

    // 2. SAVE LOCALLY — This is the source of truth
    // FIX: Access Prisma model directly by its correct lowercase name instead of dynamic lookup
    // The dynamic lookup `(activePrisma as any).appointment || (activePrisma as any).Appointment`
    // was failing silently when neither key existed on the Proxy, returning undefined and crashing.
    let localApt: any;
    try {
        localApt = await (activePrisma as any).appointment.create({
            data: {
                clientId: params.clientId,
                callerName: params.callerName,
                callerPhone: params.callerPhone ?? null,
                serviceName: params.serviceName,
                staffName: params.staffName ?? null,
                date: params.date,
                time: normalizedTime,
                notes: params.notes ?? null,
            }
        });
        console.log(`[calendar/bookAppointment] Local appointment created: ${localApt.id}`);
    } catch (err: any) {
        console.error(`[calendar/bookAppointment] CRITICAL: Failed to save local appointment:`, err.message);
        return { eventId: "", confirmed: false, error: `Error al guardar la cita en la base de datos: ${err.message}` };
    }

    // 3. SYNC TO GOOGLE (Best effort — failure does NOT cancel the booking)
    try {
        const { oAuth2Client, calendarId } = await getAuthenticatedClient(
            params.clientId,
            activePrisma,
            params.staffCalendarId
        );
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

        // FIX: Build datetime strings without Z and let Google handle the timezone explicitly.
        // This avoids Node.js Date stringifications shifting times in the background.
        const [hStr, mStr] = normalizedTime.split(':');
        const startTotalMin = parseInt(hStr) * 60 + parseInt(mStr);
        const endTotalMin = startTotalMin + durationMin;
        const endH = String(Math.floor(endTotalMin / 60)).padStart(2, '0');
        const endM = String(endTotalMin % 60).padStart(2, '0');

        const event = await calendar.events.insert({
            calendarId,
            requestBody: {
                summary: `${params.serviceName} — ${params.callerName}`,
                description: params.notes || "Cita registrada por CitaLiks",
                start: {
                    dateTime: `${params.date}T${normalizedTime}:00`,
                    timeZone: 'Europe/Madrid'
                },
                end: {
                    dateTime: `${params.date}T${endH}:${endM}:00`,
                    timeZone: 'Europe/Madrid'
                },
            },
        });

        const externalId = event.data.id ?? undefined;
        if (externalId) {
            await (activePrisma as any).appointment.update({
                where: { id: localApt.id },
                data: { externalId }
            });
            console.log(`[calendar/bookAppointment] Synced to Google Calendar: ${externalId}`);
        }
    } catch (err) {
        // Google sync failed — local booking still stands, this is intentional
        console.warn(`[calendar/bookAppointment] Google Sync failed (local booking confirmed):`, (err as any).message);
    }

    return { eventId: localApt.id, confirmed: true };
}

export async function cancelAppointment(params: {
    clientId: string;
    callerName?: string;    // Optional: search by name
    callerPhone?: string;   // Optional: search by phone (fallback when name not remembered)
    date?: string;          // Optional: narrow search by date
    time?: string;
    prismaOverride?: any;
    staffCalendarId?: string;
}): Promise<{ cancelled: boolean; message: string; appointmentFound?: boolean }> {
    const db = params.prismaOverride || prisma;

    // FIX: Try local DB first (source of truth), then Google Calendar
    // Previous code went directly to Google Calendar and crashed if not connected

    // 1. Cancel in local DB — try by name first, then by phone
    let localCancelled = false;
    try {
        // Build flexible where clause: match by name OR phone
        const whereClause: any = {
            clientId: params.clientId,
            status: "CONFIRMED"
        };

        if (params.callerName) {
            whereClause.callerName = { contains: params.callerName, mode: 'insensitive' };
        } else if (params.callerPhone) {
            // Search by last digits of phone for flexibility (e.g. "678" matches "+34612345678")
            const phoneSuffix = params.callerPhone.replace(/\D/g, '').slice(-9);
            whereClause.callerPhone = { endsWith: phoneSuffix };
        }

        if (params.date) {
            whereClause.date = params.date;
        }
        if (params.time) {
            whereClause.time = params.time.substring(0, 5);
        }

        const appointments = await (db as any).appointment.findMany({ where: whereClause });

        if (appointments.length > 0) {
            await (db as any).appointment.update({
                where: { id: appointments[0].id },
                data: { status: "CANCELLED" }
            });
            localCancelled = true;
            console.log(`[calendar/cancelAppointment] Local appointment ${appointments[0].id} cancelled`);

            // Also cancel in Google if externalId exists
            if (appointments[0].externalId) {
                try {
                    const { oAuth2Client, calendarId } = await getAuthenticatedClient(params.clientId, db, params.staffCalendarId);
                    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
                    await calendar.events.delete({ calendarId, eventId: appointments[0].externalId });
                    console.log(`[calendar/cancelAppointment] Google event ${appointments[0].externalId} deleted`);
                } catch (gErr) {
                    console.warn(`[calendar/cancelAppointment] Could not delete Google event (local cancel stands):`, (gErr as any).message);
                }
            }
        }
    } catch (err) {
        console.error(`[calendar/cancelAppointment] Local cancel failed:`, (err as any).message);
    }

    if (localCancelled) {
        const dateMsg = params.date ? ` del ${params.date}` : '';
        return { cancelled: true, appointmentFound: true, message: `Cita${dateMsg} cancelada correctamente` };
    }

    // If no name or phone provided, we cannot search further
    if (!params.callerName && !params.callerPhone) {
        return {
            cancelled: false,
            appointmentFound: false,
            message: "Para cancelar necesito al menos tu nombre o el número de teléfono con el que hiciste la reserva."
        };
    }

    // 2. Fallback: try Google Calendar search if local not found (only when date is provided)
    if (!params.date) {
        return {
            cancelled: false,
            appointmentFound: false,
            message: "No encontré ninguna cita con esos datos. ¿Puedes decirme el día de la cita?"
        };
    }

    try {
        const { oAuth2Client, calendarId } = await getAuthenticatedClient(params.clientId, db, params.staffCalendarId);
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

        const timeMin = new Date(`${params.date}T00:00:00Z`);
        const timeMax = new Date(`${params.date}T23:59:59Z`);

        const res = await calendar.events.list({
            calendarId,
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            q: params.callerName ?? params.callerPhone ?? '',
            singleEvents: true,
        });

        const events = res.data.items ?? [];
        if (events.length === 0) {
            return {
                cancelled: false,
                appointmentFound: false,
                message: "No encontré ninguna cita para esa fecha con esos datos. ¿Puedes confirmar el nombre o el teléfono con el que reservaste?"
            };
        }

        await calendar.events.delete({ calendarId, eventId: events[0].id! });
        return { cancelled: true, appointmentFound: true, message: `Cita del ${params.date} cancelada correctamente` };
    } catch (err) {
        console.warn(`[calendar/cancelAppointment] Google fallback failed:`, (err as any).message);
        return {
            cancelled: false,
            appointmentFound: false,
            message: "No encontré ninguna cita para esa fecha. ¿Puedes decirme el número de teléfono con el que reservaste?"
        };
    }
}

export async function listEvents(clientId: string, params?: { staffCalendarId?: string; staffName?: string; prismaOverride?: any }) {
    const db = params?.prismaOverride || prisma;
    const staffCalendarId = params?.staffCalendarId;
    const staffName = params?.staffName;

    const allEvents: any[] = [];

    // 1. Get Google Events (best effort)
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
        // FIX: Use a date string directly (YYYY-MM-DD) for comparison instead of
        // new Date().toISOString().split('T')[0] which returns UTC date and can
        // exclude today's appointments in UTC+ timezones (e.g. Spain UTC+1).
        const todayStr = new Date().toLocaleDateString('sv-SE'); // 'sv-SE' gives YYYY-MM-DD in local time

        // FIX: When a staffName filter is provided, also include appointments with
        // no staffName assigned (bot bookings without explicit staff selection).
        // Previously, filtering by staffName excluded these unassigned appointments,
        // making bot-booked citas invisible in the calendar.
        const staffFilter = staffName
            ? { OR: [{ staffName }, { staffName: null }] }
            : {};

        const localApts = await (db as any).appointment.findMany({
            where: {
                clientId,
                ...staffFilter,
                status: "CONFIRMED",
                date: { gte: todayStr }
            },
            orderBy: [{ date: 'asc' }, { time: 'asc' }],
            take: 20
        });

        allEvents.push(...localApts.map((a: any) => {
            // FIX: Build ISO string with explicit Europe/Madrid offset (+01:00 winter / +02:00 summer)
            // Using +00:00 was treating the stored local time as UTC, causing events to appear
            // 1 hour later in the calendar UI (e.g. 09:00 stored → shown as 10:00).
            // We compute the actual Madrid offset dynamically to handle DST correctly.
            const madridOffset = (() => {
                const d = new Date(`${a.date}T${a.time}:00Z`);
                const madridStr = d.toLocaleString('en-US', { timeZone: 'Europe/Madrid', hour12: false, hour: '2-digit' });
                const utcStr = d.toLocaleString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit' });
                const diff = parseInt(madridStr) - parseInt(utcStr);
                const absDiff = Math.abs(diff);
                const sign = diff >= 0 ? '+' : '-';
                return `${sign}${String(absDiff).padStart(2, '0')}:00`;
            })();
            const startISO = `${a.date}T${a.time}:00${madridOffset}`;
            const endISO = new Date(new Date(startISO).getTime() + (a.durationMin || 30) * 60_000).toISOString();
            return {
                id: `local-${a.id}`,
                summary: a.serviceName,
                start: { dateTime: startISO },
                end: { dateTime: endISO },
                source: 'local',
                metadata: {
                    callerName: a.callerName,
                    callerPhone: a.callerPhone,
                    serviceName: a.serviceName,
                    notes: a.notes,
                    status: a.status
                }
            };
        }));
    } catch (err) {
        console.error(`[calendar/listEvents] Local fetch failed:`, err);
    }

    return allEvents.sort((a, b) => {
        const t1 = new Date(a.start.dateTime || a.start.date).getTime();
        const t2 = new Date(b.start.dateTime || b.start.date).getTime();
        return t1 - t2;
    });
}
