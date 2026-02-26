import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Creates a dynamic Prisma client for a specific tenant database.
 * Returns a Proxy that allows case-insensitive model access for robustness.
 */
export function getTenantPrisma(url: string) {
    const client = new PrismaClient({
        datasourceUrl: url,
    });

    return new Proxy(client, {
        get(target: any, prop: string | symbol) {
            if (typeof prop === 'string' && !prop.startsWith('$') && !prop.startsWith('_')) {
                // Try original requested name
                if (prop in target) return target[prop];

                // Try camelCase (e.g., appointment)
                const camel = prop.charAt(0).toLowerCase() + prop.slice(1);
                if (camel in target) return target[camel];

                // Try PascalCase (e.g., Appointment)
                const pascal = prop.charAt(0).toUpperCase() + prop.slice(1);
                if (pascal in target) return target[pascal];

                // Case-insensitive slow search as last resort for debugging
                const keys = Object.keys(target);
                const match = keys.find(k => k.toLowerCase() === prop.toLowerCase());
                if (match) return target[match];
            }
            return target[prop];
        },
        ownKeys(target) {
            return Reflect.ownKeys(target);
        },
        getOwnPropertyDescriptor(target, prop) {
            return Reflect.getOwnPropertyDescriptor(target, prop);
        }
    }) as any;

}
