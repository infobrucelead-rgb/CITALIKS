import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    const startMs = Date.now();
    const logPath = path.join(process.cwd(), 'retell_debug.log');

    try {
        const body = await req.json();
        const { event, call } = body;

        console.log(`[retell/webhook] Received event: ${event}`);
        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] WEBHOOK_EVENT: ${event}\nBODY: ${JSON.stringify(body, null, 2)}\n`);

        // Handle specific events if needed
        if (event === 'call_ended' || event === 'call_analyzed') {
            console.log(`[retell/webhook] Call ended/analyzed for call_id: ${call?.call_id}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[retell/webhook] Error handling webhook:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
