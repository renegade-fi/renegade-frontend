import { z } from "zod/v4";

import { zChainId, zHexString } from "@/env/schema";

/** Zod schema for accepted sides */
export const zSide = z.enum(["buy", "sell"]);

/** Zod schema for accepted currencies */
export const zCurrency = z.enum(["base", "quote"]);

// --- Wallet --- //

export const zWallet = z.object({
    seed: zHexString.optional(),
    id: z.string().optional(),
});

export type CachedWallet = z.infer<typeof zWallet>;

export const createEmptyWallet = (): CachedWallet => zWallet.parse({});

export const zWalletMap = z.map(zChainId, zWallet);

// --- Server State --- //

export const zRememberMeMap = z.map(zChainId, z.boolean());

export const ServerStateSchema = z.object({
    chainId: zChainId,
    wallet: zWalletMap,
    rememberMe: zRememberMeMap,
    order: z.object({
        side: zSide,
        amount: z.string(),
        currency: zCurrency,
    }),
    baseMint: zHexString,
    quoteMint: zHexString,
    allowExternalMatches: z.boolean(),
    panels: z.object({
        layout: z.array(z.number()),
    }),
});

export type ServerState = z.infer<typeof ServerStateSchema>;
