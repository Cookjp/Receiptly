import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    env: {
        // Expose whether Tabscanner is configured (without exposing the key itself)
        NEXT_PUBLIC_TABSCANNER_ENABLED: process.env.TABSCANNER_API_KEY ? 'true' : '',
    },
};

export default nextConfig;
