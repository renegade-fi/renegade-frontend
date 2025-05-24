import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod/v4"

import { zHexString } from "./schema"

export const env = createEnv({
  server: {
    // ================================
    // Chain & RPC Configuration
    // ================================

    /** Arbitrum RPC URL */
    RPC_URL: z.url(),

    /** Ethereum mainnet RPC URL */
    RPC_URL_MAINNET: z.url().default("https://cloudflare-eth.com"),

    /** Solana mainnet RPC URL */
    RPC_URL_SOLANA: z.url().default("https://api.mainnet-beta.solana.com"),

    /** Darkpool contract deployment block number on Arbitrum */
    ARBITRUM_DEPLOY_BLOCK: z.number().default(0),

    // ================================
    // External Services
    // ================================

    /** Amberdata API key for blockchain analytics */
    AMBERDATA_API_KEY: z.string().min(1),

    /** Bot server URL */
    BOT_SERVER_URL: z.url(),

    /** Bot server API key */
    BOT_SERVER_API_KEY: z.string().min(1),

    // ================================
    // Monitoring
    // ================================

    /** Datadog environment identifier */
    DD_ENV: z.string().min(1),

    /** Datadog service name */
    DD_SERVICE: z.string().min(1),

    /** Datadog application key */
    DD_APP_KEY: z.string().min(1),

    /** Datadog API key */
    DD_API_KEY: z.string().min(1),

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

    /** Vercel Edge Config URL */
    EDGE_CONFIG: z.url(),

    // ================================
    // Development
    // ================================

    /** Private key for development/testing */
    DEV_PRIVATE_KEY: zHexString.optional(),
  },

  experimental__runtimeEnv: process.env,
})
