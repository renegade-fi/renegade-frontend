import type { OrderMetadata } from "@renegade-fi/react";
import { oneMinute } from "@/lib/constants/time";
import { formatNumber } from "@/lib/format";
import { resolveAddress } from "@/lib/token";
import { decimalNormalizePrice } from "@/lib/utils";

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
    offset: number = 0.1,
): [number, number] {
    const padding = (maxValue - minValue) * offset;
    const lowerBound = minValue - padding;
    const upperBound = maxValue + padding;

    if (minValue < 10) {
        return [lowerBound, upperBound];
    }
    return [Math.floor(lowerBound), Math.ceil(upperBound)];
}

/**
 * Transforms raw order fills into normalized chart data
 * Converts amounts and prices using token decimals, sorts chronologically
 */
export function formatFills(order: OrderMetadata): FormattedFill[] {
    const baseToken = resolveAddress(order.data.base_mint);
    const quoteToken = resolveAddress(order.data.quote_mint);

    return order.fills
        .map((fill) => ({
            amount: Number(formatNumber(fill.amount, baseToken.decimals)),
            price: Number(
                decimalNormalizePrice(fill.price.price, baseToken.decimals, quoteToken.decimals),
            ),
            timestamp: Number(fill.price.timestamp),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Rounds a timestamp to the nearest minute, rounding down
 * @param timestamp - The timestamp to round
 * @returns The rounded timestamp
 */
export function roundToNearestMinute(timestamp: number): number {
    return Math.floor(timestamp / 60000) * 60000;
}

/**
 * Calculates time range for OHLC data fetching
 * Adds 30min padding before/after fills, rounds to minute boundaries
 */
export function calculateTimeRange(formattedFills: FormattedFill[]): TimeRange {
    if (formattedFills.length === 0) {
        throw new Error("Cannot calculate time range for empty fills array");
    }

    const minFillTimestamp = formattedFills[0].timestamp;
    const maxFillTimestamp = formattedFills[formattedFills.length - 1].timestamp;

    // 30min padding for visual context
    const paddingMs = oneMinute * 30;

    const startTime = minFillTimestamp - paddingMs;
    const endTime = maxFillTimestamp + paddingMs;

    // Round to nearest minute for OHLC alignment
    return {
        endMs: roundToNearestMinute(endTime),
        startMs: roundToNearestMinute(startTime),
    };
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

    // Sample data for performance (target: 150 points)
    const targetPoints = 150;
    const sampleRate = Math.floor(result.length / targetPoints);
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
export function calculateMinMax(data: ChartDataPoint[]) {
    return data.reduce(
        ([min, max], item) => [
            Math.min(
                min,
                item.price ?? Number.POSITIVE_INFINITY,
                item.fillPrice ?? Number.POSITIVE_INFINITY,
            ),
            Math.max(
                max,
                item.price ?? Number.NEGATIVE_INFINITY,
                item.fillPrice ?? Number.NEGATIVE_INFINITY,
            ),
        ],
        [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
    );
}

/**
 * Creates Y-axis formatter with appropriate precision for the price range
 * For narrow ranges (like stablecoins), shows more decimal places
 */
export function createYAxisFormatter(minValue: number, maxValue: number) {
    const range = maxValue - minValue;
    const midpoint = (minValue + maxValue) / 2;

    // Detect stablecoin-like pairs: narrow ranges around 1.0
    const isStablecoinRange = midpoint > 0.5 && midpoint < 2.0 && range < 0.01;

    return (value: number): string => {
        if (value <= 0) {
            return "$0.00";
        }

        let decimals = 2; // Default for most assets

        if (isStablecoinRange) {
            // For stablecoins, show enough precision to see meaningful differences
            decimals = Math.max(4, Math.ceil(-Math.log10(range)) + 1);
        } else if (value < 1) {
            // For small values, use dynamic precision
            decimals = Math.max(2, -Math.floor(Math.log10(value)) + 1);
        }

        return new Intl.NumberFormat("en-US", {
            currency: "USD",
            maximumSignificantDigits: 6,
            minimumSignificantDigits: 1,
            style: "currency",
        }).format(value);
    };
}

/**
 * Creates a percentage formatter, using significant digits to show meaningful precision
 * @param numerator - The numerator of the percentage
 * @param denominator - The denominator of the percentage
 * @returns The formatted percentage
 */
export function createPercentageFormatter(numerator: number, denominator: number): string {
    if (denominator === 0 || numerator === 0) {
        return "0.00";
    }
    const ratio = numerator / denominator;
    const percentage = ratio * 100;

    return new Intl.NumberFormat("en-US", {
        maximumSignificantDigits: 6,
        minimumSignificantDigits: 1,
        useGrouping: false,
    }).format(percentage);
}
