import { CHAIN_IDS } from "@renegade-fi/react/constants";
import z from "zod/v4";

/** Zod schema for 0x-prefixed addresses */
export const zHexString = z.templateLiteral(["0x", z.string()]);

/** Dynamically create chain ID literals from CHAIN_IDS */
export const chainIdValues = Object.values(CHAIN_IDS);
const chainIdLiterals = chainIdValues.map((id) => z.literal(id)) as [
    ...z.ZodLiteral<(typeof chainIdValues)[number]>[],
];

/**
 * zChainIdKey: a raw union of numeric chain-ID literals.
 * Used as a "pure" key schema in z.record(...) (Zod requires literal schemas here).
 */
export const zChainIdKey = z.union(chainIdLiterals);

/**
 * zChainId: coercing schema for external inputs (env vars, JSON, etc.).
 * Coerces strings → numbers, then validates against our literal set.
 */
export const zChainId = z.coerce.number().pipe(zChainIdKey);

/** Zod schema for JSON strings */
export const zJsonString = z.string().transform((str, ctx): z.ZodJSONSchema => {
    try {
        return JSON.parse(str);
    } catch (_e) {
        ctx.addIssue({ code: "custom", message: "Invalid JSON" });
        return z.NEVER;
    }
});

/** Zod schema for token mappings */
const zTokenMetadata = z.object({
    name: z.string().nonempty(),
    ticker: z.string().nonempty(),
    address: zHexString,
    decimals: z.coerce.number(),
    supported_exchanges: z.record(z.string().nonempty(), z.string().nonempty()),
    chain_addresses: z.record(z.string().nonempty(), z.string().nonempty()).optional(),
    logo_url: z.url().optional(),
    canonical_exchange: z.string().nonempty(),
});

const zTokenMapping = z.object({
    tokens: z.array(zTokenMetadata),
});

export const zTokenMappingJson = zJsonString.pipe(zTokenMapping);
