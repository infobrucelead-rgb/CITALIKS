import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: ["localhost:3000", "localhost:3003"],
        },
        serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'stripe', 'googleapis'],
    },
};

export default nextConfig;
