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
    // Eliminado /api/admin/ de aquí para hacerlo privado
]);

const isAdminRoute = createRouteMatcher(["/api/admin/(.*)"]);

const proxyHandler = clerkMiddleware(async (auth, req) => {
    // 1. Proteger rutas de administración (Solo PLATFORM_ADMIN)
    if (isAdminRoute(req)) {
        const { userId, sessionClaims } = await auth();
        const role = (sessionClaims?.metadata as any)?.role;

        if (!userId || role !== 'PLATFORM_ADMIN') {
            return new Response(JSON.stringify({ error: "No autorizado. Se requiere rol PLATFORM_ADMIN." }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }
        return; // Permitir si es admin
    }

    // 2. Rutas de Retell, Stripe webhooks y crons: no requieren auth de Clerk
    if (isPublicApiRoute(req)) {
        return;
    }

    // 3. Rutas del dashboard y onboarding: requieren auth básica
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export default proxyHandler;
export { proxyHandler as proxy };

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
