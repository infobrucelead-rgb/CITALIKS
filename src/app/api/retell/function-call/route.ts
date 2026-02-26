import { NextRequest, NextResponse } from "next/server";
import { prisma, getTenantPrisma } from "@/lib/db";
import {
    checkAvailability,
    bookAppointment,
    cancelAppointment,
} from "@/lib/calendar";

import fs from 'fs';
import path from 'path';

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDateES(dateStr: string): string {
    try {
        const d = new Date(`${dateStr}T12:00:00`);
        return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
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
    const logPath = path.join(process.cwd(), 'retell_debug.log');
    const rawBody = await req.text();
    const webhookUrl = req.url || "unknown";
    const headers = Object.fromEntries(req.headers.entries());

    fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] REQUEST_START: ${webhookUrl}\nHEADERS: ${JSON.stringify(headers)}\nRAW: ${rawBody}\n`);

    let body: any;
    try {
        body = JSON.parse(rawBody);
    } catch {
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ERROR: Invalid JSON\n`);
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log("[retell/function-call] Incoming:", JSON.stringify(body, null, 2));

    const { function_name, args } = body;
    const clientId = args?.client_id as string;

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

        const resolveStaff = async (name?: string) => {
            if (!name) return null;
            const staffList = (clientContext as any).staff || [];
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

                // Find service duration
                const service = (clientContext.services || []).find(
                    (s: any) => !service_name || s.name.toLowerCase().includes(service_name.toLowerCase())
                );
                const durationMin = service?.durationMin ?? 30;

                const staff = await resolveStaff(staff_name);

                console.log(`[retell/function-call] check_availability: date=${date} service=${service_name}(${durationMin}min) staff=${staff?.name || 'none'}`);

                // Find the business-wide schedule for this day (staffId=null only!)
                const dateObj = new Date(`${date}T12:00:00`);
                const dayOfWeek = (dateObj.getDay() + 6) % 7;
                const businessSchedules = (clientContext.schedules || []).filter((s: any) => !s.staffId);
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
                        prismaOverride: activePrisma
                    }
                );

                const slotStrings = slots.slice(0, 10).map((s) => `${s.start} - ${s.end}`);
                const slotsMessage = slots.length > 0
                    ? `Hay ${slots.length} huecos disponibles el ${formatDateES(date)}${staff ? ` con ${staff.name}` : ""}: ${slotStrings.join(", ")}.`
                    : `No hay disponibilidad el ${formatDateES(date)}${staff ? ` con ${staff.name}` : ""}. El horario del negocio ese día es: ${scheduleUsed}.`;

                console.log(`[retell/function-call] Slots found: ${slots.length}`);

                result = {
                    available_slots: slotStrings,
                    message: slotsMessage,
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
                const { caller_name, service_name, date, time, notes, staff_name } = args as {
                    caller_name: string;
                    service_name: string;
                    date: string;
                    time: string;
                    notes?: string;
                    staff_name?: string;
                };

                const service = (clientContext.services || []).find(
                    (s: any) => !service_name || s.name.toLowerCase().includes(service_name.toLowerCase())
                );
                const staff = await resolveStaff(staff_name);

                console.log(`[retell/function-call] book_appointment: ${caller_name} ${service_name} ${date} ${time}`);

                const { eventId, confirmed, error: bookingError } = await bookAppointment({
                    clientId,
                    callerName: caller_name,
                    callerPhone: args.caller_number,
                    serviceName: service_name,
                    date,
                    time,
                    notes,
                    durationMin: service?.durationMin ?? 30,
                    prismaOverride: activePrisma,
                    staffCalendarId: staff?.googleCalendarId,
                    staffName: staff?.name
                });

                if (confirmed) {
                    try {
                        await activePrisma.callLog.create({
                            data: {
                                clientId,
                                callerNumber: args.caller_number ?? "desconocido",
                                actionTaken: "booked",
                                appointmentId: eventId,
                                summary: `Cita ${service_name} para ${caller_name} el ${date} a las ${time}${staff ? ` con ${staff.name}` : ""}`,
                            },
                        });
                    } catch (logErr) {
                        console.warn("[retell/function-call] CallLog save failed:", (logErr as any).message);
                    }
                } else {
                    const msg = `BOOKING_FAILED: ${bookingError} for ${caller_name} at ${time}`;
                    console.error(`[retell/function-call] ${msg}`);
                    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
                }

                result = {
                    confirmed,
                    message: confirmed
                        ? `Perfecto, ${caller_name}. Tu cita de ${service_name}${staff ? ` con ${staff.name}` : ""} queda confirmada para el ${formatDateES(date)} a las ${time}. ¡Hasta pronto!`
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
                const { caller_name, date, time } = args as {
                    caller_name: string;
                    date: string;
                    time?: string;
                };

                const { cancelled, message } = await cancelAppointment({
                    clientId,
                    callerName: caller_name,
                    date,
                    time,
                    prismaOverride: activePrisma
                });

                if (cancelled) {
                    try {
                        await activePrisma.callLog.create({
                            data: {
                                clientId,
                                callerNumber: args.caller_number ?? "desconocido",
                                actionTaken: "cancelled",
                                summary: `Cita cancelada de ${caller_name} el ${date}`,
                            },
                        });
                    } catch (logErr) {
                        console.warn("[retell/function-call] CallLog save failed:", (logErr as any).message);
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
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] RESULT: ${JSON.stringify(result)}\n`);

        if (tenantPrisma) {
            tenantPrisma.$disconnect().catch(() => { });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        const errMsg = error.message || "Error desconocido";
        const stack = error.stack || "No stack trace";
        console.error("[retell/function-call] Unhandled error:", error);
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] UNHANDLED_ERROR: ${errMsg}\nSTACK: ${stack}\n`);

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
