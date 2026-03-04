import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/calendar";

/**
 * GET /api/diag
 * 
 * Protected by APP_SECRET. Use: /api/diag?secret=<APP_SECRET>
 */
export async function GET(req: NextRequest) {
    // ─── Security: Require APP_SECRET ──────────────────────────────────────────
    const secret = req.nextUrl.searchParams.get("secret");
    const appSecret = process.env.APP_SECRET;

    if (!appSecret || secret !== appSecret) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // ───────────────────────────────────────────────────────────────────────────

    const dynamicRedirectUri = `${req.nextUrl.origin}/api/google/callback`;
    const envRedirectUri = process.env.GOOGLE_REDIRECT_URI;

    const extractRedirectUri = (url: string) => {
        try { return new URL(url).searchParams.get("redirect_uri"); }
        catch { return url; }
    };

    let googleRedirectUriDynamic = "";
    let googleRedirectUriEnv = "";
    try {
        googleRedirectUriDynamic = extractRedirectUri(getGoogleAuthUrl("test", dynamicRedirectUri)) || "";
        googleRedirectUriEnv = extractRedirectUri(getGoogleAuthUrl("test")) || "";
    } catch (e: any) {
        googleRedirectUriDynamic = `ERROR: ${e.message}`;
    }

    return NextResponse.json({
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Configurado" : "FALTA",
        GOOGLE_REDIRECT_URI_ENV: envRedirectUri,
        req_origin: req.nextUrl.origin,
        req_host: req.headers.get("host"),
        x_forwarded_host: req.headers.get("x-forwarded-host"),
        x_forwarded_proto: req.headers.get("x-forwarded-proto"),
        dynamic_redirect_uri_built: dynamicRedirectUri,
        google_sends_dynamic: googleRedirectUriDynamic,
        google_sends_env: googleRedirectUriEnv,
        current_url: req.url,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
}
