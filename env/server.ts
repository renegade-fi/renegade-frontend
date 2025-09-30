import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

import { zHexString } from "./schema";

export const env = createEnv({
    experimental__runtimeEnv: process.env,
    server: {
        // ================================
        // Chain & RPC Configuration
        // ================================

        /** Alchemy API key for multi-chain RPC access */
        ALCHEMY_API_KEY: z.string().min(1),

        // ================================
        // External Services
        // ================================

        /** Amberdata API key for blockchain analytics */
        AMBERDATA_API_KEY: z.string().min(1),

        /** Bot server API keys */
        ARBITRUM_BOT_SERVER_API_KEY: z.string().min(1),
        BASE_BOT_SERVER_API_KEY: z.string().min(1),

        /** Datadog API key */
        DD_API_KEY: z.string().min(1),

        /** Datadog application key */
        DD_APP_KEY: z.string().min(1),

        // ================================
        // Monitoring
        // ================================
        /** Datadog service name */
        DD_SERVICE: z.string().min(1),

        // ================================
        // Development
        // ================================

        /** Private key for development/testing */
        DEV_PRIVATE_KEY: zHexString.optional(),

        /** Vercel Edge Config URL */
        EDGE_CONFIG: z.url(),

        // ================================
        // Storage
        // ================================

        /** Vercel KV read-only access token */
        KV_REST_API_READ_ONLY_TOKEN: z.string().optional(),

        /** Vercel KV read/write access token */
        KV_REST_API_TOKEN: z.string().optional(),

        /** Vercel KV REST API endpoint URL */
        KV_REST_API_URL: z.url().optional(),

        /** Vercel KV connection URL */
        KV_URL: z.string().optional(),

        /** Neon database connection URL */
        ON_CHAIN_EVENTS_DATABASE_URL: z.string().url(),
        /** TWAP server HTTP auth password */
        TWAP_HTTP_AUTH_PASSWORD: z.string().min(1),

        /** TWAP server URL */
        TWAP_SERVER_URL: z.url(),
    },
});
