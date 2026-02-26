/**
 * Netelip SMS Service
 * Sends SMS messages via Netelip API v1.0
 * API docs: https://apidoc.netelip.com/v1/sms/
 */

const NETELIP_SMS_URL = "https://api.netelip.com/v1/sms/api.php";
const NETELIP_STATUS_URL = "https://api.netelip.com/v1/sms/status.php";

/** Maximum SMS length (Netelip limit) */
const MAX_SMS_LENGTH = 160;

export interface SmsSendResult {
    success: boolean;
    smsId?: string;
    remainingBalance?: number;
    error?: string;
    statusCode?: number;
}

export interface SmsStatusResult {
    status: "OK" | "ERROR" | "PENDING" | "UNKNOWN";
    deliveredAt?: string;
    error?: string;
}

/**
 * Normalizes a Spanish phone number to the international format required by Netelip.
 * Netelip expects: 0034XXXXXXXXX (00 + country code + number)
 * Examples:
 *   "677146735"   → "0034677146735"
 *   "+34677146735" → "0034677146735"
 *   "0034677146735" → "0034677146735" (already correct)
 */
export function normalizePhoneForNetelip(phone: string): string {
    // Remove all non-digit characters except leading +
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");

    if (cleaned.startsWith("0034")) {
        return cleaned; // Already in correct format
    }
    if (cleaned.startsWith("+34")) {
        return "00" + cleaned.slice(1); // +34... → 0034...
    }
    if (cleaned.startsWith("34") && cleaned.length === 11) {
        return "00" + cleaned; // 34XXXXXXXXX → 0034XXXXXXXXX
    }
    if (cleaned.length === 9) {
        return "0034" + cleaned; // XXXXXXXXX → 0034XXXXXXXXX
    }
    // Fallback: prepend 0034 and hope for the best
    return "0034" + cleaned.replace(/^\+/, "");
}

/**
 * Truncates a message to the SMS limit, adding ellipsis if needed.
 */
function truncateSms(text: string): string {
    if (text.length <= MAX_SMS_LENGTH) return text;
    return text.slice(0, MAX_SMS_LENGTH - 3) + "...";
}

/**
 * Parses the XML response from Netelip SMS API.
 * Returns { status, smsId, remainingBalance } or throws on parse error.
 */
function parseNetelipSmsResponse(xml: string): { status: number; smsId?: string; remainingBalance?: number } {
    const statusMatch = xml.match(/<status>(\d+)<\/status>/);
    const smsIdMatch = xml.match(/<ID-SMS>([\d.]+)<\/ID-SMS>/);
    const balanceMatch = xml.match(/<remainingbalance>([\d.]+)<\/remainingbalance>/);

    const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;
    const smsId = smsIdMatch ? smsIdMatch[1] : undefined;
    const remainingBalance = balanceMatch ? parseFloat(balanceMatch[1]) : undefined;

    return { status, smsId, remainingBalance };
}

/**
 * Sends an SMS via Netelip API.
 *
 * @param to - Destination phone number (Spanish format: 677XXXXXX or +34677XXXXXX)
 * @param message - SMS text content (max 160 chars)
 * @param from - Sender ID (max 11 chars). Defaults to "CITALIKS"
 * @returns SmsSendResult with success status and SMS ID
 */
export async function sendSms(
    to: string,
    message: string,
    from: string = "CITALIKS"
): Promise<SmsSendResult> {
    const token = process.env.NETELIP_API_TOKEN;
    if (!token) {
        console.error("[SMS] NETELIP_API_TOKEN not configured");
        return { success: false, error: "NETELIP_API_TOKEN not configured" };
    }

    const destination = normalizePhoneForNetelip(to);
    const truncatedMessage = truncateSms(message);
    // Netelip sender max 11 chars
    const sender = from.slice(0, 11);

    console.log(`[SMS] Sending to ${destination} from "${sender}": "${truncatedMessage}"`);

    try {
        const params = new URLSearchParams({
            token,
            from: sender,
            destination,
            message: truncatedMessage,
        });

        const response = await fetch(NETELIP_SMS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const xmlText = await response.text();
        console.log(`[SMS] Netelip response (HTTP ${response.status}):`, xmlText);

        const parsed = parseNetelipSmsResponse(xmlText);

        if (parsed.status === 200) {
            console.log(`[SMS] Sent successfully. SMS ID: ${parsed.smsId}, Balance: ${parsed.remainingBalance}`);
            return {
                success: true,
                smsId: parsed.smsId,
                remainingBalance: parsed.remainingBalance,
                statusCode: parsed.status,
            };
        }

        const errorMessages: Record<number, string> = {
            103: "Parámetros erróneos",
            401: "Token de autenticación inválido",
            402: "Saldo insuficiente para enviar SMS",
            406: "Parámetro obligatorio omitido",
            412: "Error no reconocido",
            500: "Error interno del servidor de Netelip",
            503: "Servicio de Netelip en mantenimiento",
        };

        const errorMsg = errorMessages[parsed.status] || `Error desconocido (código ${parsed.status})`;
        console.error(`[SMS] Send failed: ${errorMsg}`);
        return { success: false, error: errorMsg, statusCode: parsed.status };

    } catch (err: any) {
        const errMsg = err?.message || "Error de red al contactar Netelip";
        console.error("[SMS] Network error:", errMsg);
        return { success: false, error: errMsg };
    }
}

/**
 * Checks the delivery status of a previously sent SMS.
 *
 * @param smsId - The SMS ID returned by sendSms
 * @returns SmsStatusResult with delivery status
 */
export async function getSmsStatus(smsId: string): Promise<SmsStatusResult> {
    const token = process.env.NETELIP_API_TOKEN;
    if (!token) {
        return { status: "ERROR", error: "NETELIP_API_TOKEN not configured" };
    }

    try {
        const params = new URLSearchParams({ token, "id-sms": smsId });

        const response = await fetch(NETELIP_STATUS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const xmlText = await response.text();
        const statusMatch = xmlText.match(/<status>(OK|ERROR|PENDING)<\/status>/);
        const dateMatch = xmlText.match(/<date>(.*?)<\/date>/);

        const status = (statusMatch?.[1] as "OK" | "ERROR" | "PENDING") || "UNKNOWN";
        const deliveredAt = dateMatch?.[1] || undefined;

        return { status, deliveredAt };
    } catch (err: any) {
        return { status: "ERROR", error: err?.message || "Error de red" };
    }
}

// ── SMS Templates ─────────────────────────────────────────────────────────────

/**
 * Generates the booking confirmation SMS text.
 * Kept under 160 chars for single-segment delivery.
 */
export function buildConfirmationSms(params: {
    businessName: string;
    clientName: string;
    serviceName: string;
    date: string; // "lunes 3 de marzo"
    time: string; // "11:30"
    staffName?: string;
}): string {
    const { businessName, clientName, serviceName, date, time, staffName } = params;
    const staffPart = staffName ? ` con ${staffName}` : "";
    // Keep it short and friendly
    const msg = `${businessName}: Hola ${clientName}, tu cita de ${serviceName}${staffPart} está confirmada para el ${date} a las ${time}. ¡Hasta pronto!`;
    return truncateSms(msg);
}

/**
 * Generates the reminder SMS text (sent ~3 hours before the appointment).
 */
export function buildReminderSms(params: {
    businessName: string;
    clientName: string;
    serviceName: string;
    date: string; // "lunes 3 de marzo"
    time: string; // "11:30"
    staffName?: string;
    businessPhone?: string;
}): string {
    const { businessName, clientName, serviceName, date, time, staffName, businessPhone } = params;
    const staffPart = staffName ? ` con ${staffName}` : "";
    const phonePart = businessPhone ? ` Llámanos al ${businessPhone} si necesitas cambiarla.` : "";
    const msg = `${businessName}: Recordatorio - ${clientName}, tienes cita de ${serviceName}${staffPart} hoy a las ${time}.${phonePart}`;
    return truncateSms(msg);
}

/**
 * Generates the cancellation confirmation SMS text.
 */
export function buildCancellationSms(params: {
    businessName: string;
    clientName: string;
    serviceName?: string;
    date: string;
    time?: string;
}): string {
    const { businessName, clientName, serviceName, date, time } = params;
    const servicePart = serviceName ? ` de ${serviceName}` : "";
    const timePart = time ? ` a las ${time}` : "";
    const msg = `${businessName}: Tu cita${servicePart} del ${date}${timePart} ha sido cancelada. ¡Hasta pronto, ${clientName}!`;
    return truncateSms(msg);
}
