/**
 * SMS Reminders Cron Endpoint
 * POST /api/sms/reminders
 *
 * This endpoint is designed to be called by an external cron service (e.g., Vercel Cron,
 * GitHub Actions, or any HTTP cron scheduler) every 30 minutes.
 *
 * It finds all CONFIRMED appointments that:
 *   - Are scheduled within the next 3 hours (±15 min window)
 *   - Have not had a reminder SMS sent yet (smsReminderSent = false)
 *   - Have a valid callerPhone
 *
 * Then sends a reminder SMS via Netelip and marks the appointment as reminded.
 *
 * Security: Protected by CRON_SECRET header (set CRON_SECRET in .env).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSms, buildReminderSms } from "@/lib/sms";

/** Window in minutes: send reminder if appointment is between (TARGET - WINDOW) and (TARGET + WINDOW) */
const REMINDER_TARGET_MINUTES = 180; // 3 hours before
const REMINDER_WINDOW_MINUTES = 15;  // ±15 min tolerance

/**
 * Formats a date string "YYYY-MM-DD" + time "HH:MM" into a Date object
 * in Europe/Madrid timezone.
 */
function appointmentToDate(date: string, time: string): Date {
    // Parse as Madrid local time by constructing an ISO string with offset
    // We use a simple approach: build a Date from the local string and adjust for Madrid offset.
    // Madrid is UTC+1 in winter, UTC+2 in summer (CET/CEST).
    // We calculate the offset dynamically.
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);

    // Create a Date object assuming the time is in Madrid local time.
    // We use the Intl API trick: format a known UTC time and compare.
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

    // Get Madrid offset at this moment
    const madridFormatter = new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
    });

    // Calculate offset by comparing UTC time with Madrid time
    const madridParts = madridFormatter.formatToParts(utcDate);
    const madridHour = parseInt(madridParts.find(p => p.type === "hour")?.value || "0");
    const madridMinute = parseInt(madridParts.find(p => p.type === "minute")?.value || "0");

    const utcHour = utcDate.getUTCHours();
    const utcMinute = utcDate.getUTCMinutes();

    let offsetMinutes = (madridHour * 60 + madridMinute) - (utcHour * 60 + utcMinute);
    // Handle day boundary wrap
    if (offsetMinutes > 720) offsetMinutes -= 1440;
    if (offsetMinutes < -720) offsetMinutes += 1440;

    // Adjust: subtract the offset to get the correct UTC time for this Madrid local time
    return new Date(utcDate.getTime() - offsetMinutes * 60 * 1000);
}

/**
 * Formats a date for display in Spanish.
 */
function formatDateSpanish(dateStr: string): string {
    try {
        const d = new Date(`${dateStr}T12:00:00Z`);
        return d.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Europe/Madrid",
        });
    } catch {
        return dateStr;
    }
}

export async function POST(req: NextRequest) {
    // Security: verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get("authorization");
        const providedSecret = authHeader?.replace("Bearer ", "");
        if (providedSecret !== cronSecret) {
            console.warn("[SMS/reminders] Unauthorized cron attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const now = new Date();
    const targetTime = new Date(now.getTime() + REMINDER_TARGET_MINUTES * 60 * 1000);
    const windowStart = new Date(targetTime.getTime() - REMINDER_WINDOW_MINUTES * 60 * 1000);
    const windowEnd = new Date(targetTime.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);

    console.log(`[SMS/reminders] Running at ${now.toISOString()}`);
    console.log(`[SMS/reminders] Looking for appointments between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

    try {
        // Find all confirmed appointments that haven't been reminded yet
        // We query by date and filter by time in memory (simpler than complex SQL time math)
        const today = now.toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" }); // YYYY-MM-DD
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
            .toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });

        const candidates = await prisma.appointment.findMany({
            where: {
                status: "CONFIRMED",
                smsReminderSent: false,
                callerPhone: { not: null },
                date: { in: [today, tomorrow] },
            },
            include: {
                client: {
                    select: {
                        businessName: true,
                        phone: true,
                    },
                },
            },
        });

        console.log(`[SMS/reminders] Found ${candidates.length} candidate appointments`);

        const results = {
            processed: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            details: [] as Array<{ id: string; phone: string; status: string; error?: string }>,
        };

        for (const appt of candidates) {
            const apptDate = appointmentToDate(appt.date, appt.time);
            const minutesUntil = (apptDate.getTime() - now.getTime()) / (60 * 1000);

            results.processed++;

            // Check if within the reminder window
            if (minutesUntil < REMINDER_TARGET_MINUTES - REMINDER_WINDOW_MINUTES ||
                minutesUntil > REMINDER_TARGET_MINUTES + REMINDER_WINDOW_MINUTES) {
                console.log(`[SMS/reminders] Skipping ${appt.id}: ${minutesUntil.toFixed(0)} min away (outside window)`);
                results.skipped++;
                continue;
            }

            const phone = appt.callerPhone!;
            const businessName = appt.client?.businessName || "Tu negocio";
            const businessPhone = appt.client?.phone || undefined;

            const message = buildReminderSms({
                businessName,
                clientName: appt.callerName,
                serviceName: appt.serviceName,
                date: formatDateSpanish(appt.date),
                time: appt.time,
                staffName: appt.staffName || undefined,
                businessPhone,
            });

            console.log(`[SMS/reminders] Sending reminder to ${phone} for appointment ${appt.id}`);

            const smsResult = await sendSms(phone, message, businessName.slice(0, 11));

            if (smsResult.success) {
                // Mark as reminded
                await prisma.appointment.update({
                    where: { id: appt.id },
                    data: {
                        smsReminderSent: true,
                        smsReminderSentAt: new Date(),
                    },
                });

                results.sent++;
                results.details.push({ id: appt.id, phone, status: "sent" });
                console.log(`[SMS/reminders] ✓ Reminder sent for appointment ${appt.id}`);
            } else {
                results.errors++;
                results.details.push({ id: appt.id, phone, status: "error", error: smsResult.error });
                console.error(`[SMS/reminders] ✗ Failed for appointment ${appt.id}: ${smsResult.error}`);
            }
        }

        console.log(`[SMS/reminders] Done: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`);

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            window: {
                from: windowStart.toISOString(),
                to: windowEnd.toISOString(),
            },
            ...results,
        });

    } catch (err: any) {
        console.error("[SMS/reminders] Unhandled error:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Error desconocido" },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint for health check / manual trigger from browser
 */
export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const url = new URL(req.url);
        const secret = url.searchParams.get("secret");
        if (secret !== cronSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    return NextResponse.json({
        status: "ok",
        message: "SMS reminders endpoint is active. Use POST to trigger.",
        reminderWindow: `${REMINDER_TARGET_MINUTES} min before ± ${REMINDER_WINDOW_MINUTES} min`,
    });
}
