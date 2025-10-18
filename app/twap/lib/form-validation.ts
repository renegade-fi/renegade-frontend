/**
 * Validation helpers for TWAP parameter form
 */

import { DURATION_PRESETS } from "./constants";

interface FormData {
    start_time: string;
    durationIndex: number;
    input_amount: string;
}

/**
 * Validates that the end time (start time + duration) is not in the future
 */
export function validateEndTimeNotInFuture(data: FormData): boolean {
    const startTime = new Date(data.start_time);
    const duration = DURATION_PRESETS[data.durationIndex];
    const durationMilliseconds = (duration.hours * 3600 + duration.minutes * 60) * 1000;
    const endTime = new Date(startTime.getTime() + durationMilliseconds);
    const now = new Date();

    return endTime <= now;
}

/**
 * Calculates the individual trade size (clip size)
 * Trade size = total amount / number of trades
 * Number of trades = duration in seconds / 30 seconds per trade
 */
export function calculateTradeSize(data: FormData): number | null {
    const inputAmount = Number.parseFloat(data.input_amount);
    if (Number.isNaN(inputAmount)) return null;

    const duration = DURATION_PRESETS[data.durationIndex];
    const durationSeconds = duration.hours * 3600 + duration.minutes * 60;
    const numberOfTrades = durationSeconds / 30;
    const tradeSize = inputAmount / numberOfTrades;

    return tradeSize;
}

/**
 * Validates that each individual trade size is between 1 and 250,000 USDC
 */
export function validateTradeSizeInRange(data: FormData): boolean {
    const tradeSize = calculateTradeSize(data);
    if (tradeSize === null) return false;

    return tradeSize >= 1 && tradeSize <= 250000;
}
