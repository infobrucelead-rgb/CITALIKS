/**
 * Manual SMS Send Endpoint
 * POST /api/sms/send
 *
 * For testing and manual SMS sending from the dashboard.
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { to, message, from } = body as {
            to: string;
            message: string;
            from?: string;
        };

        if (!to || !message) {
            return NextResponse.json(
                { error: "Se requieren los campos 'to' y 'message'" },
                { status: 400 }
            );
        }

        const result = await sendSms(to, message, from);

        return NextResponse.json(result, { status: result.success ? 200 : 500 });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || "Error desconocido" },
            { status: 500 }
        );
    }
}
