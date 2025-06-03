import { isSupportedChainId } from "@renegade-fi/react"
import { ChainId } from "@renegade-fi/react/constants"
import z from "zod/v4"

/** Zod schema for 0x-prefixed addresses */
export const zHexString = z.templateLiteral(["0x", z.string()])

/** Zod schema for accepted chain IDs */
export const zChainId = z.coerce
  .number()
  .refine((val): val is ChainId => isSupportedChainId(val), {
    message: "Invalid chain ID",
  })

/** Zod schema for JSON strings */
export const zJsonString = z.string().transform((str, ctx): z.ZodJSONSchema => {
  try {
    return JSON.parse(str)
  } catch (e) {
    ctx.addIssue({ code: "custom", message: "Invalid JSON" })
    return z.NEVER
  }
})

/** Zod schema for token mappings */
const zTokenMetadata = z.object({
  name: z.string().nonempty(),
  ticker: z.string().nonempty(),
  address: zHexString,
  decimals: z.coerce.number(),
  supported_exchanges: z.record(z.string().nonempty(), z.string().nonempty()),
  chain_addresses: z
    .record(z.string().nonempty(), z.string().nonempty())
    .optional(),
  logo_url: z.url().optional(),
  canonical_exchange: z.string().nonempty(),
})

const zTokenMapping = z.object({
  tokens: z.array(zTokenMetadata),
})

export const zTokenMappingJson = zJsonString.pipe(zTokenMapping)
