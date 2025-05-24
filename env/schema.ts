import { isSupportedChainId } from "@renegade-fi/react"
import { ChainId, CHAIN_IDS } from "@renegade-fi/react/constants"
import z from "zod/v4"

/** Zod schema for 0x-prefixed addresses */
export const zHexString = z.templateLiteral(["0x", z.string()])

/** Dynamically create chain ID literals from CHAIN_IDS */
const chainIdValues = Object.values(CHAIN_IDS)
const chainIdLiterals = chainIdValues.map((id) => z.literal(id)) as [
  z.ZodLiteral<(typeof chainIdValues)[0]>,
  ...z.ZodLiteral<(typeof chainIdValues)[number]>[],
]

/** Zod schema for accepted chain IDs with type narrowing to number literals */
export const zChainId = z.coerce.number().pipe(z.union(chainIdLiterals))
