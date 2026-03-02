import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ['@prisma/client', 'prisma', 'stripe', 'googleapis'],
    experimental: {
        serverActions: {
            allowedOrigins: ["localhost:3000", "localhost:3003"],
        },
    },
};

export default nextConfig;
