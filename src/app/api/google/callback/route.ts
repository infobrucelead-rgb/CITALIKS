import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/calendar";
import { prisma } from "@/lib/db";

// Google redirects here after the user grants Calendar access
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // clientId or clientId:token
    const error = searchParams.get("error");

    // Safely parse state to find token
    let tokenStr = "";
    let baseClientIdStr = "";
    if (state) {
        const parts = state.split(":");
        baseClientIdStr = parts[0];
        if (parts.length > 1) tokenStr = parts[1];
    }

    if (error || !code || !state) {
        const errUrl = tokenStr
            ? `/onboarding?token=${tokenStr}&calendar=error`
            : `/onboarding?calendar=error`;
        return NextResponse.redirect(new URL(errUrl, req.url));
    }

    try {
        const redirectUri = `${req.nextUrl.origin}/api/google/callback`;
        await exchangeCodeForTokens(code, baseClientIdStr, redirectUri);

        // Update onboarding step to 5 (Calendar connected)
        await prisma.client.update({
            where: { id: baseClientIdStr },
            data: { onboardingStep: 5 }
        });

        const onboardingUrl = tokenStr
            ? `/onboarding?token=${tokenStr}&calendar=connected`
            : `/onboarding?calendar=connected`;

        return NextResponse.redirect(new URL(onboardingUrl, req.url));
    } catch (err) {
        console.error("[google/callback] error:", err);
        const errFallbackUrl = tokenStr
            ? `/onboarding?token=${tokenStr}&calendar=error`
            : `/onboarding?calendar=error`;
        return NextResponse.redirect(new URL(errFallbackUrl, req.url));
    }
}
