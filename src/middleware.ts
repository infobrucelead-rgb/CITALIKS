import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/onboarding(.*)"]);

// Rutas que Retell AI llama server-to-server: deben ser completamente públicas
// y NO pasar por el middleware de Clerk para evitar el error 500 "dev-browser-missing"
const isPublicApiRoute = createRouteMatcher([
    "/api/retell/(.*)",
    "/api/google/callback(.*)",
    "/api/stripe/(.*)",
    "/api/cron/(.*)",
    "/api/diag(.*)",
    "/api/admin/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    // Rutas de Retell, Stripe webhooks y crons: no requieren auth de Clerk
    if (isPublicApiRoute(req)) {
        return;
    }
    // Rutas del dashboard y onboarding: requieren auth
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
