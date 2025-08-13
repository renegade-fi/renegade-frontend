// Constants
import type { Exchange } from "@renegade-fi/react";
import { parseUnits } from "viem/utils";

import { resolveTicker } from "../token";

// Min fill size of the quote asset that the relayer will accept
export const MIN_FILL_SIZE = parseUnits("1", resolveTicker("USDC").decimals);
// Minimum deposit amount (in USD)
export const MIN_DEPOSIT_AMOUNT = 1;

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
