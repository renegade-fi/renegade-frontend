// Constants
import type { Exchange } from "@renegade-fi/react";
import { parseUnits } from "viem/utils";

import { resolveTicker } from "../token";

// Min fill size of the quote asset that the relayer will accept
export const MIN_FILL_SIZE = parseUnits("1", resolveTicker("USDC").decimals);
// TODO: [CORRECTNESS] Should fetch from relayer
// Renegade protocol fee
export const PROTOCOL_FEE = 0.0002;
// Renegade relayer fee
export const RELAYER_FEE = 0.0002;
// Total Renegade fee in basis points
export const TOTAL_RENEGADE_FEE_BPS = (PROTOCOL_FEE + RELAYER_FEE) * 10000;
// Minimum deposit amount (in USD)
export const MIN_DEPOSIT_AMOUNT = 1;

// Types

// Side
export enum Side {
    BUY = "buy",
    SELL = "sell",
}

export const EXCHANGES = ["binance", "coinbase", "kraken", "okx"] as const;

export const exchangeToName: Record<Exchange, string> = {
    binance: "Binance",
    coinbase: "Coinbase",
    kraken: "Kraken",
    okx: "OKX",
    renegade: "Renegade",
};
