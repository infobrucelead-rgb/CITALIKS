import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/calendar";
import { prisma } from "@/lib/db";

// Google redirects here after the user grants Calendar access
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // clientId or clientId:token
    const error = searchParams.get("error");

    if (error || !code || !state) {
        return NextResponse.redirect(new URL("/onboarding?calendar=error", req.url));
    }

    const [clientId, token] = state.split(":");

    try {
        await exchangeCodeForTokens(code, clientId);

        // Update onboarding step to 5 (Calendar connected)
        await prisma.client.update({
            where: { id: clientId },
            data: { onboardingStep: 5 }
        });

        const onboardingUrl = token
            ? `/onboarding?token=${token}&calendar=connected`
            : `/onboarding?calendar=connected`;

        return NextResponse.redirect(new URL(onboardingUrl, req.url));
    } catch (err) {
        console.error("[google/callback] error:", err);
        return NextResponse.redirect(new URL("/onboarding?calendar=error", req.url));
    }
}
