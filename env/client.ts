import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

import { zTokenMappingJson } from "./schema";

export const env = createEnv({
    client: {
        // ================================
        // Deployment Environment
        // ================================

        /** Chain environment */
        NEXT_PUBLIC_CHAIN_ENVIRONMENT: z.enum(["testnet", "mainnet"]),

        /** Vercel deployment environment */
        NEXT_PUBLIC_VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),

        /** Primary site URL */
        NEXT_PUBLIC_SITE_URL: z.string().min(1),

        /** Vercel-generated URL for preview deployments */
        NEXT_PUBLIC_VERCEL_URL: z.string().optional(),

        /** Darkpool contract deployment block number on Arbitrum */
        NEXT_PUBLIC_ARBITRUM_DEPLOY_BLOCK: z.coerce.bigint().optional(),

        /** Darkpool contract deployment block number on Base */
        NEXT_PUBLIC_BASE_DEPLOY_BLOCK: z.coerce.bigint().optional(),

        // ================================
        // Token Mapping
        // ================================
        NEXT_PUBLIC_ARBITRUM_TOKEN_MAPPING: zTokenMappingJson,
        NEXT_PUBLIC_BASE_TOKEN_MAPPING: zTokenMappingJson,

        // ================================
        // Monitoring
        // ================================

        /** Datadog application ID */
        NEXT_PUBLIC_DATADOG_APPLICATION_ID: z.string().min(1),

        /** Datadog client token */
        NEXT_PUBLIC_DATADOG_CLIENT_TOKEN: z.string().min(1),

        // ================================
        // Wallet Integration
        // ================================

        /** WalletConnect project ID */
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1),
    },
    runtimeEnv: {
        NEXT_PUBLIC_ARBITRUM_DEPLOY_BLOCK: process.env.NEXT_PUBLIC_ARBITRUM_DEPLOY_BLOCK,
        NEXT_PUBLIC_BASE_DEPLOY_BLOCK: process.env.NEXT_PUBLIC_BASE_DEPLOY_BLOCK,
        NEXT_PUBLIC_ARBITRUM_TOKEN_MAPPING: process.env.NEXT_PUBLIC_ARBITRUM_TOKEN_MAPPING,
        NEXT_PUBLIC_BASE_TOKEN_MAPPING: process.env.NEXT_PUBLIC_BASE_TOKEN_MAPPING,
        NEXT_PUBLIC_CHAIN_ENVIRONMENT: process.env.NEXT_PUBLIC_CHAIN_ENVIRONMENT,
        NEXT_PUBLIC_DATADOG_APPLICATION_ID: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID,
        NEXT_PUBLIC_DATADOG_CLIENT_TOKEN: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
        NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    },
});
