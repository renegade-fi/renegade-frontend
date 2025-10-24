import type z from "zod";
import { env } from "@/env/server";
import { http } from "../http-client";
import { encodeBasicAuthCredentials } from "../utils";
import {
    SimulateTwapRequestSchema,
    SimulateTwapResponseSchema,
} from "./api-types/request-response";
import { loadChartData } from "./chart-data";

/** Base URL for the TWAP server */
const BASE_URL = env.TWAP_SERVER_URL;

/** Password for the TWAP server */
const PASSWORD = env.TWAP_HTTP_AUTH_PASSWORD;

/** Configuration for the TWAP client */
const config = {
    baseUrl: BASE_URL,
    getAuthHeaders: () => ({
        Authorization: `Basic ${encodeBasicAuthCredentials("admin", PASSWORD)}`,
    }),
};

/** Simulate TWAP route */
const SIMULATE_TWAP_ROUTE = "/simulate-twap";

/**
 * TWAP client singleton.
 *
 * In Rust you might define a `struct TwapClient` and call `TwapClient::new(config)`.
 * In Node/TypeScript, we instead export a module-level object. Because Node caches
 * modules after the first import, this object is created once and then reused
 * everywhere it’s imported.
 *
 * This makes TwapClient behave like a singleton client with shared config.
 * Conceptually, it’s similar to a lazy_static! or once_cell::Lazy in Rust:
 * it’s initialized once (at module load) and then reused everywhere.
 * Unlike Rust’s Lazy, initialization is eager (on first import), and the object is mutable unless frozen.
 */
export const TwapClient = {
    loadChartData,

    simulateTwap: (
        input: z.input<typeof SimulateTwapRequestSchema>,
    ): Promise<z.output<typeof SimulateTwapResponseSchema>> =>
        http.post(
            config,
            SIMULATE_TWAP_ROUTE,
            SimulateTwapRequestSchema,
            SimulateTwapResponseSchema,
            input,
        ),
};
