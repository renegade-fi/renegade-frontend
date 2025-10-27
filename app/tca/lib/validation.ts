/**
 * Shared validation logic for TWAP parameters
 * Framework-agnostic functions that both TwapParams and form schema consume
 */

import { DURATION_PRESETS, START_DATE_CUTOFF } from "./constants";
import { combineUtcDateTimeComponents } from "./date-utils";
import { findTokenByTicker } from "./token-utils";

export interface ValidationInput {
    token: string;
    size: string;
    durationIndex: number;
    startDate: string;
    startHour: string;
    startMinute: string;
}

export function validateToken(token: string): boolean {
    return findTokenByTicker(token) !== undefined;
}

export function validateSize(size: string): boolean {
    const sizeNum = Number(size);
    return !Number.isNaN(sizeNum) && sizeNum > 0;
}

export function validateDurationIndex(index: number): boolean {
    return index >= 0 && index < DURATION_PRESETS.length;
}

export function validateDateComponents(date: string, hour: string, minute: string): boolean {
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
    if (!hour.match(/^\d{1,2}$/)) return false;
    if (!minute.match(/^\d{1,2}$/)) return false;

    const h = Number.parseInt(hour, 10);
    const m = Number.parseInt(minute, 10);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function validateEndTimeNotInFuture(input: ValidationInput): boolean {
    const startHour = input.startHour.padStart(2, "0");
    const startMinute = input.startMinute.padStart(2, "0");
    const startTime = combineUtcDateTimeComponents(input.startDate, startHour, startMinute);
    const duration = DURATION_PRESETS[input.durationIndex];
    const durationMs = (duration.hours * 3600 + duration.minutes * 60) * 1000;
    const endTime = new Date(startTime.getTime() + durationMs);
    return endTime <= new Date();
}

export function validateTradeSize(input: ValidationInput): boolean {
    const sizeNum = Number(input.size);
    if (Number.isNaN(sizeNum)) return false;

    const duration = DURATION_PRESETS[input.durationIndex];
    const durationSeconds = duration.hours * 3600 + duration.minutes * 60;
    const numberOfTrades = durationSeconds / 30;
    const tradeSize = sizeNum / numberOfTrades;

    return tradeSize >= 1 && tradeSize <= 250000;
}

export function validateStartDateNotBeforeCutoff(input: ValidationInput): boolean {
    const startHour = input.startHour.padStart(2, "0");
    const startMinute = input.startMinute.padStart(2, "0");
    const startTime = combineUtcDateTimeComponents(input.startDate, startHour, startMinute);
    const cutoffDate = new Date(START_DATE_CUTOFF);
    return startTime >= cutoffDate;
}

/**
 * Run all validation checks
 */
export function validateTwapParams(input: ValidationInput): boolean {
    return (
        validateToken(input.token) &&
        validateSize(input.size) &&
        validateDurationIndex(input.durationIndex) &&
        validateDateComponents(input.startDate, input.startHour, input.startMinute) &&
        validateEndTimeNotInFuture(input) &&
        validateStartDateNotBeforeCutoff(input) &&
        validateTradeSize(input)
    );
}
