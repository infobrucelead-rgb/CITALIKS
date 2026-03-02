import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Excluir librerías pesadas del bundle de cada Serverless Function.
    // Esto evita que Prisma (~20MB), Stripe (~8MB) y googleapis (~116MB)
    // se empaqueten en cada una de las 36 rutas API, reduciendo el tamaño
    // total de los outputs y previniendo el socket timeout en Vercel.
    serverExternalPackages: ['@prisma/client', 'prisma', 'stripe', 'googleapis'],
    experimental: {
        serverActions: {
            allowedOrigins: ["localhost:3000", "localhost:3003"],
        },
    },
};

export default nextConfig;
