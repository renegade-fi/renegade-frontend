/**
 * Validation helpers for TWAP parameter form
 */

import { DURATION_PRESETS } from "./constants";
import { TwapParams } from "./url-params";
import {
    type ValidationInput,
    validateEndTimeNotInFuture as validateEndTimeNotInFutureCore,
    validateStartDateNotBeforeCutoff as validateStartDateNotBeforeCutoffCore,
    validateTradeSize as validateTradeSizeCore,
} from "./validation";

interface FormData {
    start_time: string;
    durationIndex: number;
    input_amount: string;
    selectedBase: string;
    direction: "Buy" | "Sell";
    binance_fee_tier: string;
}

/**
 * Converts form data to ValidationInput format
 */
function formDataToValidationInput(data: FormData): ValidationInput {
    const params = TwapParams.fromFormData(data);
    return {
        durationIndex: params.durationIndex,
        size: params.size,
        startDate: params.startDate,
        startHour: params.startHour,
        startMinute: params.startMinute,
        token: params.token,
    };
}

/**
 * Validates that the end time (start time + duration) is not in the future
 */
export function validateEndTimeNotInFuture(data: FormData): boolean {
    return validateEndTimeNotInFutureCore(formDataToValidationInput(data));
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
    return validateTradeSizeCore(formDataToValidationInput(data));
}

/**
 * Validates that the start date is not before the cutoff date (2025-10-25)
 */
export function validateStartDateNotBeforeCutoff(data: FormData): boolean {
    return validateStartDateNotBeforeCutoffCore(formDataToValidationInput(data));
}
