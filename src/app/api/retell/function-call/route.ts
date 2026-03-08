import { NextRequest, NextResponse } from "next/server";
import { prisma, getTenantPrisma } from "@/lib/db";
import {
    checkAvailability,
    bookAppointment,
    cancelAppointment,
} from "@/lib/calendar";
import { sendSms, buildConfirmationSms, buildCancellationSms } from "@/lib/sms";

// import fs from 'fs';
// import path from 'path';

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDateES(dateStr: string): string {
    try {
        // FIX: Use UTC noon to avoid day-boundary shift when formatting
        const d = new Date(`${dateStr}T12:00:00Z`);
        return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });
    } catch { return dateStr; }
}

/** Save a log entry directly via raw SQL so it works even without Prisma codegen */
async function saveBotLog(data: {
    clientId: string;
    functionName: string;
    inputArgs: object;
    resultJson?: object;
    slotsFound?: number;
    scheduleUsed?: string;
    errorMsg?: string;
    durationMs?: number;
    webhookUrl?: string;
    confirmed?: boolean;
}) {
    try {
        const id = `bl${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
        const inputStr = JSON.stringify(data.inputArgs);
        const resultStr = data.resultJson ? JSON.stringify(data.resultJson) : null;

        await prisma.$executeRaw`
            INSERT INTO "bot_logs" (
                "id", "clientId", "functionName", "inputArgs", "resultJson",
                "slotsFound", "scheduleUsed", "errorMsg", "durationMs", "webhookUrl", "confirmed", "createdAt"
            ) VALUES (
                ${id}, ${data.clientId}, ${data.functionName}, ${inputStr}, ${resultStr},
                ${data.slotsFound ?? null}, ${data.scheduleUsed ?? null}, ${data.errorMsg ?? null},
                ${data.durationMs ?? null}, ${data.webhookUrl ?? null}, ${data.confirmed ?? null}, NOW()
            )
        `;
    } catch (err) {
        // Log failure must NOT crash the main flow
        console.error("[BotLog] Failed to save log:", (err as any).message);
    }
}

// ── main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const startMs = Date.now();
    const rawBody = await req.text();
    const webhookUrl = req.url || "unknown";

    // FIX: Do NOT write to local filesystem in production (Vercel is read-only)
    console.log(`[${new Date().toISOString()}] REQUEST_START: ${webhookUrl}`);
    console.log(`RAW BODY: ${rawBody}`);

    let body: any;
    try {
        body = JSON.parse(rawBody);
    } catch {
        console.error(`[${new Date().toISOString()}] ERROR: Invalid JSON`);
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log("[retell/function-call] Incoming:", JSON.stringify(body, null, 2));

    // FIX: Extract function name from URL query param first (100% reliable)
    // then fallback to body, and if all fails, try to guess from args based on required params.
    const urlName = req.nextUrl.searchParams.get("name");

    let args: any = body.args ?? body.arguments ?? {};
    let parsedFunctionName: string | null = urlName ?? body.function_name ?? body.name ?? null;

    if (!parsedFunctionName && args) {
        // Heuristic fallback inside the webhook if Retell payload gets completely mangled
        if (args.time && args.caller_name) {
            parsedFunctionName = "book_appointment";
        } else if (args.date && !args.time) {
            parsedFunctionName = "check_availability";
        }
    }

    const function_name: string = parsedFunctionName || "unknown";
    let clientId = args?.client_id as string;

    // FALLBACK: If clientId is missing (common in phone calls if dynamic variables fail),
    // try to resolve it using the phone number called (to_number)
    // body.call.to_number is provided by Retell in the webhook requestBODY
    if (!clientId && body.call?.to_number) {
        const toPhone = body.call.to_number as string;
        console.log(`[retell/function-call] ClientId missing in args. Attempting resolution via to_number: ${toPhone}`);

        const resolvedClient = await prisma.client.findFirst({
            where: {
                OR: [
                    { phone: toPhone },
                    { phone: { endsWith: toPhone.replace("+34", "") } }
                ]
            },
            select: { id: true, businessName: true }
        });

        if (resolvedClient) {
            clientId = resolvedClient.id;
            console.log(`[retell/function-call] Resolved clientId: ${clientId} (${resolvedClient.businessName})`);
        }
    }

    // Extract caller phone number from the Retell call object.
    // Retell exposes it as body.call.from_number for inbound calls.
    // This is the real phone number of the person calling, not a parameter the LLM passes.
    const callerPhoneFromRetell: string | null =
        body.call?.from_number ??
        body.call?.caller_number ??
        null;

    const retellCallId: string | null = body.call?.call_id ?? null;

    console.log(`[retell/function-call] Resolved function_name='${function_name}' clientId='${clientId}' callId='${retellCallId}' callerPhone='${callerPhoneFromRetell ?? 'unknown'}'`);

    if (!clientId) {
        await saveBotLog({
            clientId: "unknown",
            functionName: function_name || "unknown",
            inputArgs: args || {},
            errorMsg: "Missing client_id in args",
            durationMs: Date.now() - startMs,
            webhookUrl,
        });
        return NextResponse.json({ error: "client_id requerido" }, { status: 400 });
    }

    try {
        // 1. Get client from Master DB
        const masterClient = await prisma.client.findUnique({
            where: { id: clientId },
            include: { services: true, schedules: true, staff: true },
        }) as any;

        if (!masterClient) {
            await saveBotLog({
                clientId,
                functionName: function_name,
                inputArgs: args,
                errorMsg: "Client not found in Master DB",
                durationMs: Date.now() - startMs,
                webhookUrl,
            });
            return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
        }

        // 2. Determine which Prisma client to use
        let activePrisma: any = prisma;
        let tenantPrisma: any = null;

        if (masterClient.databaseUrl) {
            console.log("[retell/function-call] Routing to Tenant DB");
            tenantPrisma = getTenantPrisma(masterClient.databaseUrl);
            activePrisma = tenantPrisma;
        }

        // 3. Fetch full context from active DB
        const clientContext = tenantPrisma
            ? await tenantPrisma.client.findFirst({
                where: { clerkUserId: masterClient.clerkUserId },
                include: { services: true, schedules: true, staff: true }
            })
            : masterClient;

        // FIX: If tenant DB lookup returns null, fall back to masterClient to avoid null reference crashes
        const safeContext = clientContext || masterClient;

        const resolveStaff = async (name?: string) => {
            if (!name) return null;
            const staffList = (safeContext as any).staff || [];
            return staffList.find((s: any) => s.name.toLowerCase().includes(name.toLowerCase())) || null;
        };

        let result: Record<string, unknown> = {};

        switch (function_name) {
            case "consultar_disponibilidad":
            case "check_availability": {
                const { date, service_name, staff_name } = args as {
                    date: string;
                    service_name?: string;
                    staff_name?: string;
                };

                // Guard: date is required
                if (!date) {
                    result = { error: "Para consultar disponibilidad necesito que me digas el día. ¿Para qué fecha quieres la cita?" };
                    break;
                }
                // Find service duration with flexible matching
                // 1. Try exact match (case insensitive)
                // 2. Try partial match
                // 3. Fallback to 30 min
                const serviceList = (safeContext.services || []);
                const service = serviceList.find((s: any) =>
                    service_name && s.name.toLowerCase() === service_name.toLowerCase()
                ) || serviceList.find((s: any) =>
                    service_name && s.name.toLowerCase().includes(service_name.toLowerCase())
                );

                const durationMin = service?.durationMin ?? 30;
                // Offer slots every 30 mins even if service is longer (e.g. 45 min)
                const stepMin = 30;

                // FIX: Assign a real staff member always.
                // If the caller specified a name, try to match it.
                // If no match or no name given, pick a random staff member from the client's list.
                // This ensures every appointment is always linked to a real professional.
                const staffList: any[] = (safeContext as any).staff || [];
                let staff = await resolveStaff(staff_name);
                if (!staff && staffList.length > 0) {
                    staff = staffList[Math.floor(Math.random() * staffList.length)];
                    console.log(`[retell/function-call] No staff specified — auto-assigned: ${staff?.name}`);
                }

                // Build staff list message for the bot to offer choices if multiple staff exist
                const staffNamesMsg = staffList.length > 1
                    ? ` Los profesionales disponibles son: ${staffList.map((s: any) => s.name).join(', ')}.`
                    : '';

                console.log(`[retell/function-call] check_availability: date=${date} service=${service_name}(${durationMin}min) staff=${staff?.name || 'none'}`);

                // Find the business-wide schedule for this day
                // FIX: Use UTC noon + getUTCDay() to avoid timezone-induced day shift
                const dateObj = new Date(`${date}T12:00:00Z`);
                const dayOfWeek = (dateObj.getUTCDay() + 6) % 7;
                const businessSchedules = (safeContext.schedules || []).filter((s: any) => !s.staffId);
                const daySchedule = businessSchedules.find((s: any) => s.dayOfWeek === dayOfWeek);
                const scheduleUsed = daySchedule
                    ? (daySchedule.isOpen ? `OPEN ${daySchedule.openTime}-${daySchedule.closeTime}` : `CLOSED`)
                    : `NO_SCHEDULE_DAY_${dayOfWeek}`;

                console.log(`[retell/function-call] Day ${dayOfWeek} schedule: ${scheduleUsed}`);

                const slots = await checkAvailability(
                    clientId,
                    date,
                    durationMin,
                    {
                        staffCalendarId: staff?.googleCalendarId,
                        prismaOverride: activePrisma,
                        stepMin: stepMin
                    }
                );

                const slotStrings = slots.slice(0, 10).map((s) => `${s.start} - ${s.end}`);
                const slotsMessage = slots.length > 0
                    ? `Hay ${slots.length} huecos disponibles el ${formatDateES(date)} con ${staff?.name || 'el equipo'}.${staffNamesMsg} Los primeros huecos son: ${slotStrings.join(", ")}.`
                    : `No hay disponibilidad el ${formatDateES(date)}${staff ? ` con ${staff.name}` : ""}. El horario del negocio ese día es: ${scheduleUsed}.`;

                console.log(`[retell/function-call] Slots found: ${slots.length}`);

                // Include detected phone number in response so the bot can:
                // a) Confirm it with the caller (they called US, so we detected their number)
                // b) Pass it to book_appointment as caller_phone if confirmed
                const phoneMsg = callerPhoneFromRetell
                    ? ` Veo que nos llamas desde el número ${callerPhoneFromRetell}. ¿Quieres que guardemos este número para la cita o prefieres indicar otro?`
                    : '';

                const now = new Date();
                const serverTime = {
                    date: now.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Madrid" }).split("/").reverse().join("-"),
                    time: now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Madrid" }),
                    weekday: now.toLocaleDateString("es-ES", { weekday: "long", timeZone: "Europe/Madrid" })
                };

                result = {
                    available_slots: slotStrings,
                    staff_name: staff?.name || null,
                    detected_phone: callerPhoneFromRetell,
                    server_current_time: serverTime,
                    message: slotsMessage + phoneMsg,
                };

                await saveBotLog({
                    clientId,
                    functionName: function_name,
                    inputArgs: args,
                    resultJson: { slotsCount: slots.length, firstSlots: slots.slice(0, 5).map(s => s.start) },
                    slotsFound: slots.length,
                    scheduleUsed,
                    durationMs: Date.now() - startMs,
                    webhookUrl,
                });
                break;
            }

            case "reservar_cita":
            case "book_appointment": {
                const { caller_name, service_name, date, time, notes, staff_name, caller_phone } = args as {
                    caller_name: string;
                    service_name: string;
                    date: string;
                    time: string;
                    notes?: string;
                    staff_name?: string;
                    caller_phone?: string;
                };

                // Guard: validate required booking fields
                if (!date || !time) {
                    result = { error: `Para reservar necesito ${!date ? 'la fecha' : 'la hora'}. ¿Me puedes indicar ${!date ? 'qué día quieres la cita' : 'a qué hora'}?` };
                    break;
                }
                if (!caller_name) {
                    result = { error: "Para guardar la cita necesito saber a nombre de quién la pongo. ¿Me dices tu nombre?" };
                    break;
                }
                if (!service_name) {
                    result = { error: "¿Para qué servicio quieres la cita?" };
                    break;
                }

                // Phone number resolution priority:
                // 1. Real phone from Retell (body.call.from_number) — most reliable
                // 2. Phone provided verbally by the caller during the call (caller_phone arg)
                // 3. Legacy args.caller_number field
                // 4. null if none available
                const resolvedPhone: string | null =
                    callerPhoneFromRetell ??
                    caller_phone ??
                    args.caller_number ??
                    null;

                console.log(`[retell/function-call] Phone resolution: retell=${callerPhoneFromRetell} verbal=${caller_phone} resolved=${resolvedPhone}`);

                // Find service with flexible matching
                const serviceListBook = (safeContext.services || []);
                const service = serviceListBook.find((s: any) =>
                    service_name && s.name.toLowerCase() === service_name.toLowerCase()
                ) || serviceListBook.find((s: any) =>
                    service_name && s.name.toLowerCase().includes(service_name.toLowerCase())
                );

                // FIX: Always assign a real staff member.
                // Use the name passed by the bot (from check_availability result),
                // or fall back to a random staff member if none specified.
                const bookStaffList: any[] = (safeContext as any).staff || [];
                let bookStaff = await resolveStaff(staff_name);
                if (!bookStaff && bookStaffList.length > 0) {
                    bookStaff = bookStaffList[Math.floor(Math.random() * bookStaffList.length)];
                    console.log(`[retell/function-call] book_appointment: auto-assigned staff: ${bookStaff?.name}`);
                }

                console.log(`[retell/function-call] book_appointment: ${caller_name} | ${service_name} | ${date} | ${time} | staff=${bookStaff?.name || 'none'}`);

                const { eventId, confirmed, error: bookingError } = await bookAppointment({
                    clientId,
                    callerName: caller_name,
                    callerPhone: resolvedPhone ?? undefined,
                    serviceName: service_name,
                    date,
                    time,
                    notes,
                    durationMin: service?.durationMin ?? 30,
                    prismaOverride: activePrisma,
                    staffCalendarId: bookStaff?.googleCalendarId,
                    staffName: bookStaff?.name
                });

                if (confirmed) {
                    try {
                        await activePrisma.callLog.create({
                            data: {
                                clientId,
                                retellCallId,
                                callerNumber: resolvedPhone ?? "desconocido",
                                actionTaken: "booked",
                                appointmentId: eventId,
                                summary: `Cita ${service_name} para ${caller_name} el ${date} a las ${time}${bookStaff ? ` con ${bookStaff.name}` : ""}`,
                            },
                        });
                    } catch (logErr) {
                        console.warn("[retell/function-call] CallLog save failed:", (logErr as any).message);
                    }

                    // ── SMS Confirmation ──────────────────────────────────────
                    // Send confirmation SMS if we have a phone number.
                    // This runs asynchronously — failure does NOT affect the booking.
                    if (resolvedPhone) {
                        const smsMessage = buildConfirmationSms({
                            businessName: masterClient.businessName || "Tu negocio",
                            clientName: caller_name,
                            serviceName: service_name,
                            date: formatDateES(date),
                            time,
                            staffName: bookStaff?.name,
                        });

                        sendSms(resolvedPhone, smsMessage, (masterClient.businessName || "CITALIKS").slice(0, 11))
                            .then(async (smsResult) => {
                                console.log(`[retell/function-call] SMS confirmation: ${smsResult.success ? 'sent' : 'failed'} — ${smsResult.error || smsResult.smsId}`);
                                // Update appointment SMS status in DB (best effort)
                                if (eventId) {
                                    try {
                                        await (activePrisma as any).appointment.update({
                                            where: { id: eventId },
                                            data: {
                                                smsConfirmationSent: smsResult.success,
                                                smsConfirmationSentAt: smsResult.success ? new Date() : undefined,
                                            },
                                        });
                                    } catch { /* ignore — SMS status is non-critical */ }
                                }
                            })
                            .catch((err) => {
                                console.error("[retell/function-call] SMS confirmation error:", err?.message);
                            });
                    } else {
                        console.log("[retell/function-call] No phone number — skipping SMS confirmation");
                    }
                } else {
                    const msg = `BOOKING_FAILED: ${bookingError} for ${caller_name} at ${time}`;
                    console.error(`[retell/function-call] ${msg}`);
                }

                // Show only last 3 digits for privacy and conversational agility
                const phoneLast3 = resolvedPhone ? resolvedPhone.replace(/\D/g, '').slice(-3) : null;
                const phoneConfirmMsg = phoneLast3
                    ? ` Hemos guardado tu teléfono acabado en ${phoneLast3} por si necesitamos contactarte.`
                    : '';

                const nowBook = new Date();
                const serverTimeBook = {
                    date: nowBook.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Madrid" }).split("/").reverse().join("-"),
                    time: nowBook.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Madrid" }),
                };

                result = {
                    confirmed,
                    server_current_time: serverTimeBook,
                    message: confirmed
                        ? `Perfecto, ${caller_name}. Tu cita de ${service_name}${bookStaff ? ` con ${bookStaff.name}` : ""} queda confirmada para el ${formatDateES(date)} a las ${time}.${phoneConfirmMsg} ¡Hasta pronto!`
                        : `Lo siento, no he podido confirmar la cita. ${bookingError || "Por favor, intenta con otro horario."}`,
                };

                await saveBotLog({
                    clientId,
                    functionName: function_name,
                    inputArgs: args,
                    resultJson: { confirmed, eventId, bookingError },
                    errorMsg: bookingError || undefined,
                    durationMs: Date.now() - startMs,
                    webhookUrl,
                    confirmed,
                });
                break;
            }

            case "cancelar_cita":
            case "cancel_appointment": {
                const { caller_name, date, time, caller_phone: cancelPhone } = args as {
                    caller_name?: string;
                    date?: string;
                    time?: string;
                    caller_phone?: string; // Phone provided verbally when caller doesn't remember their name
                };

                // Resolve phone: Retell real number > verbally provided > null
                const cancelResolvedPhone = callerPhoneFromRetell ?? cancelPhone ?? null;

                const { cancelled, message } = await cancelAppointment({
                    clientId,
                    callerName: caller_name,
                    callerPhone: cancelResolvedPhone ?? undefined,
                    date,
                    time,
                    prismaOverride: activePrisma
                });

                if (cancelled) {
                    try {
                        await activePrisma.callLog.create({
                            data: {
                                clientId,
                                retellCallId,
                                callerNumber: callerPhoneFromRetell ?? args.caller_number ?? "desconocido",
                                actionTaken: "cancelled",
                                summary: `Cita cancelada de ${caller_name} el ${date}`,
                            },
                        });
                    } catch (logErr) {
                        console.warn("[retell/function-call] CallLog save failed:", (logErr as any).message);
                    }

                    // ── SMS Cancellation ────────────────────────────────
                    // Send cancellation SMS if we have a phone number.
                    if (cancelResolvedPhone) {
                        const smsCancelMessage = buildCancellationSms({
                            businessName: masterClient.businessName || "Tu negocio",
                            clientName: caller_name || "Cliente",
                            date: date ? formatDateES(date) : "la fecha indicada",
                            time,
                        });

                        sendSms(cancelResolvedPhone, smsCancelMessage, (masterClient.businessName || "CITALIKS").slice(0, 11))
                            .then((smsResult) => {
                                console.log(`[retell/function-call] SMS cancellation: ${smsResult.success ? 'sent' : 'failed'} — ${smsResult.error || smsResult.smsId}`);
                            })
                            .catch((err) => {
                                console.error("[retell/function-call] SMS cancellation error:", err?.message);
                            });
                    }
                }

                result = { cancelled, message };

                await saveBotLog({
                    clientId,
                    functionName: function_name,
                    inputArgs: args,
                    resultJson: { cancelled, message },
                    durationMs: Date.now() - startMs,
                    webhookUrl,
                });
                break;
            }


            case "reschedule_appointment": {
                const {
                    caller_name,
                    caller_phone: reschedPhone,
                    old_date,
                    new_date,
                    new_time,
                    service_name: reschedService,
                } = args as {
                    caller_name?: string;
                    caller_phone?: string;
                    old_date?: string;
                    new_date: string;
                    new_time: string;
                    service_name?: string;
                };

                // Validate required fields
                if (!new_date || !new_time) {
                    result = { error: "Para cambiar la cita necesito la nueva fecha y la nueva hora. ¿Puedes indicarme cuándo quieres la nueva cita?" };
                    break;
                }
                if (!caller_name && !reschedPhone && !callerPhoneFromRetell) {
                    result = { error: "Para cambiar la cita necesito tu nombre o el número de teléfono con el que reservaste. ¿Puedes decirme esos datos?" };
                    break;
                }

                const reschedResolvedPhone = callerPhoneFromRetell ?? reschedPhone ?? null;

                // 1. Check availability in new slot FIRST
                const reschedService_ = (safeContext.services || []).find(
                    (s: any) => !reschedService || s.name.toLowerCase().includes(reschedService.toLowerCase())
                );
                const reschedDuration = reschedService_?.durationMin ?? 30;

                const newSlots = await checkAvailability(clientId, new_date, reschedDuration, { prismaOverride: activePrisma });
                const normalizedNewTime = new_time.substring(0, 5);
                const newSlotFree = newSlots.some(s => s.start === normalizedNewTime);

                if (!newSlotFree) {
                    const altSlots = newSlots.slice(0, 3).map(s => s.start).join(", ");
                    result = {
                        rescheduled: false,
                        message: `Lo siento, el hueco de las ${new_time} el ${formatDateES(new_date)} ya no está disponible.${altSlots ? ` Tengo libre a las ${altSlots}. ¿Te va alguno?` : " Ese día no tengo disponibilidad. ¿Probamos otro día?"}`
                    };
                    break;
                }

                // 2. Cancel old appointment (best effort — continue even if not found)
                let oldCancelMessage = "";
                if (old_date || caller_name || reschedResolvedPhone) {
                    const { cancelled, message: cancelMsg } = await cancelAppointment({
                        clientId,
                        callerName: caller_name,
                        callerPhone: reschedResolvedPhone ?? undefined,
                        date: old_date,
                        prismaOverride: activePrisma,
                    });
                    oldCancelMessage = cancelled ? " Tu cita anterior ha sido cancelada." : "";
                    console.log(`[retell/function-call] reschedule: old cancel=${cancelled} (${cancelMsg})`);
                }

                // 3. Book new appointment
                const { eventId: reschedId, confirmed: reschedConfirmed, error: reschedError } = await bookAppointment({
                    clientId,
                    callerName: caller_name || "Cliente",
                    callerPhone: reschedResolvedPhone ?? undefined,
                    serviceName: reschedService || "Servicio",
                    date: new_date,
                    time: normalizedNewTime,
                    durationMin: reschedDuration,
                    prismaOverride: activePrisma,
                });

                if (reschedConfirmed) {
                    // SMS
                    if (reschedResolvedPhone) {
                        const smsg = buildConfirmationSms({
                            businessName: masterClient.businessName || "Tu negocio",
                            clientName: caller_name || "Cliente",
                            serviceName: reschedService || "Servicio",
                            date: formatDateES(new_date),
                            time: normalizedNewTime,
                        });
                        sendSms(reschedResolvedPhone, smsg, (masterClient.businessName || "CITALIKS").slice(0, 11))
                            .catch((err) => console.error("[retell/function-call] SMS reschedule error:", err?.message));
                    }

                    result = {
                        rescheduled: true,
                        message: `Listo${caller_name ? `, ${caller_name}` : ""}.${oldCancelMessage} Tu nueva cita queda para el ${formatDateES(new_date)} a las ${normalizedNewTime}. Recibirás un SMS de confirmación. ¿Algo más?`,
                    };
                } else {
                    result = {
                        rescheduled: false,
                        message: `Pude cancelar tu cita anterior, pero no pude confirmar la nueva para las ${normalizedNewTime}. ${reschedError || "Por favor, intenta con otro horario."}`,
                    };
                }

                await saveBotLog({
                    clientId,
                    functionName: "reschedule_appointment",
                    inputArgs: args,
                    resultJson: { rescheduled: reschedConfirmed, reschedId, reschedError },
                    errorMsg: reschedError || undefined,
                    durationMs: Date.now() - startMs,
                    webhookUrl,
                    confirmed: reschedConfirmed,
                });
                break;
            }


            case "notificar_equipo": {
                // The bot calls this when a high-priority sales event occurs
                // (e.g. prospect asking about pricing, wants to speak to a human, etc.)
                const { motivo, nivel_urgencia } = args as {
                    motivo?: string;
                    nivel_urgencia?: "alta" | "media" | "baja";
                };

                const urgencyEmoji = nivel_urgencia === "alta" ? "🚨" : nivel_urgencia === "media" ? "⚠️" : "📞";
                const smsText = `${urgencyEmoji} ALERTA CITALIKS: ${masterClient.businessName || "Un cliente"} requiere atención humana. Motivo: ${motivo || "No especificado"}. Nivel: ${nivel_urgencia || "media"}. Llama ASAP.`;

                // Get admin phone from PLATFORM_ADMIN in DB
                const adminClient = await prisma.client.findFirst({
                    where: { role: "PLATFORM_ADMIN" },
                    select: { phone: true }
                });

                const adminPhone = adminClient?.phone || process.env.ADMIN_PHONE;

                if (adminPhone) {
                    try {
                        await sendSms(adminPhone, smsText, "CITALIKS");
                        console.log(`[retell/function-call] notificar_equipo: SMS sent to admin ${adminPhone}`);
                    } catch (smsErr) {
                        console.error("[retell/function-call] notificar_equipo: SMS failed:", (smsErr as any)?.message);
                    }
                } else {
                    console.warn("[retell/function-call] notificar_equipo: No admin phone configured");
                }

                result = {
                    notified: !!adminPhone,
                    message: adminPhone
                        ? "He avisado al equipo. Un miembro del equipo se pondrá en contacto contigo a la brevedad posible. ¿Hay algo más en lo que pueda ayudarte mientras tanto?"
                        : "Nuestro equipo estará disponible pronto. ¿Hay algo más con lo que pueda ayudarte?"
                };

                await saveBotLog({
                    clientId,
                    functionName: "notificar_equipo",
                    inputArgs: args,
                    resultJson: { notified: !!adminPhone, adminPhone: adminPhone ? "***" : null },
                    durationMs: Date.now() - startMs,
                    webhookUrl,
                });
                break;
            }

            default: {
                console.warn(`[retell/function-call] Unknown function: ${function_name}`);
                result = { error: `Función desconocida: ${function_name}` };

                await saveBotLog({
                    clientId,
                    functionName: function_name || "unknown",
                    inputArgs: args || {},
                    errorMsg: `Unknown function: ${function_name}`,
                    durationMs: Date.now() - startMs,
                    webhookUrl,
                });
            }
        }

        console.log("[retell/function-call] Result:", JSON.stringify(result));
        console.log(`[${new Date().toISOString()}] RESULT: ${JSON.stringify(result)}`);

        if (tenantPrisma) {
            tenantPrisma.$disconnect().catch(() => { });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        const errMsg = error.message || "Error desconocido";
        const stack = error.stack || "No stack trace";
        console.error("[retell/function-call] Unhandled error:", error);
        console.error(`[${new Date().toISOString()}] UNHANDLED_ERROR: ${errMsg}\nSTACK: ${stack}`);

        await saveBotLog({
            clientId,
            functionName: function_name || "unknown",
            inputArgs: args || {},
            errorMsg: `UNHANDLED: ${errMsg} | STACK: ${stack.slice(0, 500)}`,
            durationMs: Date.now() - startMs,
            webhookUrl,
        }).catch(() => { });

        return NextResponse.json({
            error: "Error de ejecución",
            message: `Lo siento, ha habido un problema técnico. Por favor, inténtalo de nuevo.`
        });
    }
}
