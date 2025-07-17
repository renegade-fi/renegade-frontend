import { z } from "zod/v4";

import { zChainId, zHexString } from "@/env/schema";

/** Zod schema for accepted sides */
const zSide = z.enum(["buy", "sell"]);

/** Zod schema for accepted currencies */
const zCurrency = z.enum(["base", "quote"]);

// --- Wallet --- //

const zWallet = z.object({
    id: z.string().optional(),
    seed: zHexString.optional(),
});

export type CachedWallet = z.infer<typeof zWallet>;

export const createEmptyWallet = (): CachedWallet => zWallet.parse({});

const zWalletMap = z.map(zChainId, zWallet);

// --- Server State --- //

const zRememberMeMap = z.map(zChainId, z.boolean());

const ServerStateSchema = z.object({
    allowExternalMatches: z.boolean(),
    baseMint: zHexString,
    chainId: zChainId,
    order: z.object({
        amount: z.string(),
        currency: zCurrency,
        side: zSide,
    }),
    panels: z.object({
        layout: z.array(z.number()),
    }),
    quoteMint: zHexString,
    rememberMe: zRememberMeMap,
    wallet: zWalletMap,
});

export type ServerState = z.infer<typeof ServerStateSchema>;
