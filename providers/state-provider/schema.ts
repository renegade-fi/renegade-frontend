import { z } from "zod/v4"

import { zChainId, zHexString } from "@/env/schema"

/** Zod schema for accepted sides */
export const zSide = z.enum(["buy", "sell"])

/** Zod schema for accepted currencies */
export const zCurrency = z.enum(["base", "quote"])

export const ServerStateSchema = z.object({
  wallet: z.object({
    seed: zHexString.optional(),
    chainId: zChainId.optional(),
    id: z.string().optional(),
  }),
  order: z.object({
    side: zSide,
    amount: z.string(),
    currency: zCurrency,
  }),
  baseMint: zHexString,
  quoteMint: zHexString,
  panels: z.object({
    layout: z.array(z.number()),
  }),
})

export type ServerState = z.infer<typeof ServerStateSchema>
