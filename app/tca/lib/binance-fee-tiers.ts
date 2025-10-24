// The default binance fee is VIP 3
export const DEFAULT_BINANCE_FEE = 0.0006;

export type BinanceFeeTier =
    | "No VIP"
    | "VIP 1"
    | "VIP 2"
    | "VIP 3"
    | "VIP 4"
    | "VIP 5"
    | "VIP 6"
    | "VIP 7"
    | "VIP 8"
    | "VIP 9";

export const BINANCE_FEE_TIERS: BinanceFeeTier[] = [
    "No VIP",
    "VIP 1",
    "VIP 2",
    "VIP 3",
    "VIP 4",
    "VIP 5",
    "VIP 6",
    "VIP 7",
    "VIP 8",
    "VIP 9",
];

// Taker fee in decimal. 0.001 = 0.10%
export const BINANCE_TAKER_BPS_BY_TIER: Record<BinanceFeeTier, number> = {
    "No VIP": 0.001,
    "VIP 1": 0.001,
    "VIP 2": 0.001,
    "VIP 3": 0.0006,
    "VIP 4": 0.00052,
    "VIP 5": 0.00031,
    "VIP 6": 0.00029,
    "VIP 7": 0.00028,
    "VIP 8": 0.00025,
    "VIP 9": 0.00023,
};
