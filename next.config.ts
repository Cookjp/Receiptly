import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    env: {
        // Expose whether OCR services are configured (without exposing the keys)
        NEXT_PUBLIC_OCRSPACE_ENABLED: process.env.OCRSPACE_API_KEY ? 'true' : '',
        NEXT_PUBLIC_TABSCANNER_ENABLED: process.env.TABSCANNER_API_KEY ? 'true' : '',
    },
};

export default nextConfig;
