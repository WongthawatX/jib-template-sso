import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    /* config options here */
    basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "/onsite-service",
    allowedDevOrigins: (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "").split(",").map((hostname) => hostname.trim()).filter(Boolean),
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "placehold.co",
            },
        ],
    },
}

export default nextConfig
