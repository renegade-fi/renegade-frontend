import type { OrderMetadata } from "@renegade-fi/react";
import numeral from "numeral";
import { formatNumber } from "@/lib/format";
import { resolveAddress } from "@/lib/token";
import { decimalNormalizePrice } from "@/lib/utils";

// -----------
// | CONSTANTS |
// -----------

const CHART_TARGET_POINTS = 150;
const ONE_MINUTE_MS = 60 * 1000;
const THIRTY_MINUTES_MS = 30 * ONE_MINUTE_MS;
const SMALL_VALUE_THRESHOLD = 10;
const DEFAULT_Y_AXIS_PADDING = 0.1;
const MAX_SIGNIFICANT_DIGITS = 6;
const MIN_SIGNIFICANT_DIGITS = 1;

// ---------
// | TYPES |
// ---------

export interface FormattedFill {
    amount: number;
    price: number;
    timestamp: number;
}

export interface ChartDataPoint {
    fillPrice?: number;
    price?: number;
    timestamp: string;
}

export interface OHLCBar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface TimeRange {
    startMs: number;
    endMs: number;
}

// -----------
// | HELPERS |
// -----------

/**
 * Calculates Y-axis domain with padding for better chart visualization
 * For small values (<10), preserves decimals; for larger values, rounds to integers
 */
export function calculateYAxisDomain(
    minValue: number,
    maxValue: number,
    offset: number = DEFAULT_Y_AXIS_PADDING,
): [number, number] {
    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
        throw new Error("calculateYAxisDomain: non-finite inputs");
    }
    if (minValue > maxValue) {
        [minValue, maxValue] = [maxValue, minValue];
    }

    const span = maxValue - minValue;
    const basePadding = span === 0 ? Math.max(1, Math.abs(maxValue) * 0.05) : span * offset;

    const lowerBound = minValue - basePadding;
    const upperBound = maxValue + basePadding;

    if (Math.min(Math.abs(minValue), Math.abs(maxValue)) < SMALL_VALUE_THRESHOLD) {
        return [lowerBound, upperBound];
    }
    return [Math.floor(lowerBound), Math.ceil(upperBound)];
}

/**
 * Transforms raw order fills into normalized chart data
 * Converts amounts and prices using token decimals, sorts chronologically
 */
export function formatFills(order: OrderMetadata): FormattedFill[] {
    const base = resolveAddress(order.data.base_mint);
    const quote = resolveAddress(order.data.quote_mint);

    return order.fills
        .map((fill) => {
            const amount = Number(formatNumber(fill.amount, base.decimals));
            const price = Number(
                decimalNormalizePrice(fill.price.price, base.decimals, quote.decimals),
            );
            const timestamp = Number(fill.price.timestamp);

            return { amount, price, timestamp };
        })
        .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Rounds a timestamp to the nearest minute, rounding down
 * @param timestamp - The timestamp to round
 * @returns The rounded timestamp
 */
export function roundToNearestMinute(timestamp: number): number {
    return Math.trunc(timestamp / ONE_MINUTE_MS) * ONE_MINUTE_MS;
}

/**
 * Calculates time range for OHLC data fetching
 * Adds 30min padding before/after fills, rounds to minute boundaries
 */
export function calculateTimeRange(fills: FormattedFill[]): TimeRange {
    if (fills.length === 0) {
        throw new Error("calculateTimeRange: empty fills");
    }

    const firstTs = fills[0].timestamp;
    const lastTs = fills[fills.length - 1].timestamp;

    const start = roundToNearestMinute(firstTs - THIRTY_MINUTES_MS);
    const end = roundToNearestMinute(lastTs + THIRTY_MINUTES_MS);

    return { endMs: end, startMs: start };
}

/**
 * Combines fill data with OHLC data for chart rendering
 * Handles single vs multiple fills, aligns timestamps, applies sampling for performance
 */
export function processChartData(
    formattedFills: FormattedFill[],
    ohlc: OHLCBar[] | undefined,
    orderSide: "Buy" | "Sell",
): ChartDataPoint[] {
    if (!ohlc || !ohlc.length) return [];

    // Single fill: show fill point + all OHLC close prices for context
    if (formattedFills.length === 1) {
        const fills = formattedFills.map((fill) => {
            const adjustedTimestamp = roundToNearestMinute(fill.timestamp);
            const currentBar = ohlc.find((bar) => bar.time === adjustedTimestamp);
            const bar = currentBar ? currentBar : ohlc[ohlc.length - 1];

            return {
                fillPrice: fill.price,
                // Use high for buys, low for sells (worst-case comparison)
                price: orderSide === "Sell" ? bar?.low : bar?.high,
                timestamp: fill.timestamp.toString(),
            };
        });

        const prices = ohlc.map((bar) => ({
            fillPrice: undefined,
            price: bar.close,
            timestamp: bar.time.toString(),
        }));

        return [...fills, ...prices].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    }

    // Multiple fills: map each fill to corresponding OHLC bar
    const fills = formattedFills.map((fill) => {
        const adjustedTimestamp = roundToNearestMinute(fill.timestamp);
        const currentBar = ohlc.find((bar) => bar.time === adjustedTimestamp);
        const bar = currentBar ? currentBar : ohlc[ohlc.length - 1];

        return {
            fillPrice: fill.price,
            price: orderSide === "Sell" ? bar?.low : bar?.high,
            timestamp: fill.timestamp.toString(),
        };
    });

    // Create price reference line
    const prices = ohlc.map((bar) => ({
        fillPrice: undefined,
        price: orderSide === "Sell" ? bar.low : bar.high,
        timestamp: bar.time.toString(),
    }));

    const result = [...fills, ...prices].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

    // Sample data for performance
    const sampleRate = Math.floor(result.length / CHART_TARGET_POINTS);
    if (sampleRate < 1) {
        return result;
    }

    // Always keep fill prices, sample everything else
    return result.filter((item, index) => index % sampleRate === 0 || item.fillPrice);
}

/**
 * Calculates the minimum and maximum values for a given data set
 * @param data - The data to calculate the minimum and maximum values for
 * @returns A tuple of the minimum and maximum values
 */
export function calculateMinMax(data: ChartDataPoint[]): [number, number] {
    if (data.length === 0) return [0, 0];

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const d of data) {
        const candidates = [d.price, d.fillPrice].filter(
            (v): v is number => typeof v === "number" && Number.isFinite(v),
        );
        for (const v of candidates) {
            if (v < min) min = v;
            if (v > max) max = v;
        }
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 0];
    return [min, max];
}

/**
 * Creates price formatter that always shows 2 decimal places
 * For prices with many decimals, shows up to 6 decimal places
 */
export function createPriceFormatter() {
    const formatStr = "$0,0.00[0000]";
    return (value: number): string => numeral(value).format(formatStr);
}

/**
 * Creates a percentage formatter, using significant digits to show meaningful precision
 * @param numerator - The numerator of the percentage
 * @param denominator - The denominator of the percentage
 * @returns The formatted percentage
 */
export function percentageFormatter(numerator: number, denominator: number): string {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
        return "0.00";
    }

    const percentage = (numerator / denominator) * 100;

    return new Intl.NumberFormat("en-US", {
        maximumSignificantDigits: MAX_SIGNIFICANT_DIGITS,
        minimumSignificantDigits: MIN_SIGNIFICANT_DIGITS,
        useGrouping: false,
    }).format(percentage);
}
