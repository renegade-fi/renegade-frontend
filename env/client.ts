import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod/v4"

import { zChainId } from "./schema"

export const env = createEnv({
  client: {
    // ================================
    // Deployment Environment
    // ================================

    /** Vercel deployment environment */
    NEXT_PUBLIC_VERCEL_ENV: z
      .enum(["development", "preview", "production"])
      .optional(),

    /** Primary site URL */
    NEXT_PUBLIC_SITE_URL: z.string().min(1),

    /** Vercel-generated URL for preview deployments */
    NEXT_PUBLIC_VERCEL_URL: z.string().optional(),

    // ================================
    // Chain & RPC Configuration
    // ================================

    /** Chain ID */
    NEXT_PUBLIC_CHAIN_ID: zChainId,

    /** Primary RPC URL */
    NEXT_PUBLIC_RPC_URL: z.url().default("https://arb1.arbitrum.io/rpc"),

    // ================================
    // External Services
    // ================================

    /** Price reporter service URL */
    NEXT_PUBLIC_PRICE_REPORTER_URL: z.string().min(1),

    // ================================
    // Monitoring
    // ================================

    /** Datadog application ID */
    NEXT_PUBLIC_DATADOG_APPLICATION_ID: z.string().min(1),

    /** Datadog client token */
    NEXT_PUBLIC_DATADOG_CLIENT_TOKEN: z.string().min(1),

    /** Datadog environment identifier */
    NEXT_PUBLIC_DD_ENV: z.string().min(1),

    // ================================
    // Wallet Integration
    // ================================

    /** WalletConnect project ID */
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_PRICE_REPORTER_URL: process.env.NEXT_PUBLIC_PRICE_REPORTER_URL,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_DATADOG_APPLICATION_ID:
      process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID,
    NEXT_PUBLIC_DATADOG_CLIENT_TOKEN:
      process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
    NEXT_PUBLIC_DD_ENV: process.env.NEXT_PUBLIC_DD_ENV,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  },
})
