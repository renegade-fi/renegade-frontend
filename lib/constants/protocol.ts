// Constants
import type { Exchange, TaskState } from "@renegade-fi/react";
import { parseUnits } from "viem/utils";

import { resolveTicker } from "../token";

// Min fill size of the quote asset that the relayer will accept
export const MIN_FILL_SIZE = parseUnits("1", resolveTicker("USDC").decimals);
// TODO: [CORRECTNESS] Should fetch from relayer
// Default mint
export const DEFAULT_MINT = "0x0000000000000000000000000000000000000000";
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

export const TASK_STATES: TaskState[] = [
    "Proving",
    "Submitting Tx",
    "Finding Opening",
    "Updating Validity Proofs",
    "Completed",
];

export const EXCHANGES = ["binance", "coinbase", "kraken", "okx"] as const;

export const exchangeToName: Record<Exchange, string> = {
    renegade: "Renegade",
    binance: "Binance",
    coinbase: "Coinbase",
    kraken: "Kraken",
    okx: "OKX",
};

export const UNLIMITED_ALLOWANCE = BigInt(
    "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

// Number of confirmations to wait for
export const CONFIRMATIONS = 1;
