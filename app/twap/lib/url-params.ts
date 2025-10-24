/**
 * TwapParams class for managing TWAP parameter state across URL, form, and server action formats
 */

import {
    combineUtcDateTimeComponents,
    formatUtcDateParts,
    getTwentyFourHoursAgoUtcParts,
    parseIsoToUtcParts,
} from "./date-utils";
import { findTokenByTicker } from "./token-utils";
import { validateTwapParams } from "./validation";

const DEFAULT_TOKEN = "WETH";
const DEFAULT_DIRECTION: "buy" = "buy";
const DEFAULT_SIZE = "10000";
const DEFAULT_DURATION_INDEX = 3;
const DEFAULT_BINANCE_TIER = "No VIP";

/**
 * Maps URL binanceTier parameter to internal fee tier string
 */
function urlTierToFeeTier(urlTier: string | undefined): string {
    if (!urlTier) return "No VIP";
    const match = urlTier.match(/^vip(\d+)$/i);
    if (!match) return "No VIP";
    const num = Number.parseInt(match[1], 10);
    if (num === 0) return "No VIP";
    if (num >= 1 && num <= 9) return `VIP ${num}`;
    return "No VIP";
}

/**
 * Maps internal fee tier string to URL binanceTier parameter
 */
function feeTierToUrlTier(feeTier: string): string {
    if (feeTier === "No VIP") return "vip0";
    const match = feeTier.match(/^VIP (\d+)$/i);
    if (!match) return "vip0";
    return `vip${match[1]}`;
}

/**
 * Maps duration string to DURATION_PRESETS index
 */
function durationStringToIndex(duration: string | undefined): number {
    if (!duration) return 3; // default: 1 hour
    const lower = duration.toLowerCase();

    // Map common duration strings to indices
    const mapping: Record<string, number> = {
        "1h": 3,
        "1m": 0,
        "4h": 4,
        "5m": 1,
        "12h": 5,
        "15m": 2,
        "24h": 6,
    };

    return mapping[lower] ?? 3;
}

/**
 * Maps DURATION_PRESETS index to duration string
 */
function indexToDurationString(index: number): string {
    const mapping = ["1m", "5m", "15m", "1h", "4h", "12h", "24h"];
    return mapping[index] ?? "1h";
}

export class TwapParams {
    private constructor(
        public readonly token: string,
        public readonly direction: "buy" | "sell",
        public readonly size: string,
        public readonly durationIndex: number,
        public readonly binanceTier: string,
        public readonly startDate: string,
        public readonly startHour: string,
        public readonly startMinute: string,
    ) {}

    /**
     * Parse URL searchParams with defaults
     */
    static fromUrl(searchParams: Record<string, string | string[] | undefined>): TwapParams {
        const token = typeof searchParams.token === "string" ? searchParams.token : DEFAULT_TOKEN;
        const direction =
            typeof searchParams.direction === "string"
                ? searchParams.direction.toLowerCase() === "sell"
                    ? "sell"
                    : DEFAULT_DIRECTION
                : DEFAULT_DIRECTION;
        const size = typeof searchParams.size === "string" ? searchParams.size : DEFAULT_SIZE;
        const durationIndex = durationStringToIndex(
            typeof searchParams.duration === "string" ? searchParams.duration : undefined,
        );
        const binanceTier = urlTierToFeeTier(
            typeof searchParams.binanceTier === "string" ? searchParams.binanceTier : undefined,
        );

        // Default to 24 hours ago
        const defaultParts = getTwentyFourHoursAgoUtcParts();
        const startDate =
            typeof searchParams.startDate === "string" ? searchParams.startDate : defaultParts.date;
        const startHour =
            typeof searchParams.startHour === "string"
                ? searchParams.startHour.padStart(2, "0")
                : defaultParts.hour;
        const startMinute =
            typeof searchParams.startMinute === "string"
                ? searchParams.startMinute.padStart(2, "0")
                : defaultParts.minute;

        return new TwapParams(
            token,
            direction,
            size,
            durationIndex,
            binanceTier,
            startDate,
            startHour,
            startMinute,
        );
    }

    /**
     * Create from form data submission
     */
    static fromFormData(formData: {
        selectedBase: string;
        direction: "Buy" | "Sell";
        input_amount: string;
        durationIndex: number;
        binance_fee_tier: string;
        start_time: string;
    }): TwapParams {
        // Parse token from "ticker:chainId" format
        const [ticker] = formData.selectedBase.split(":");

        // Parse start_time into components
        const startParts = parseIsoToUtcParts(formData.start_time);

        return new TwapParams(
            ticker,
            formData.direction.toLowerCase() as "buy" | "sell",
            formData.input_amount,
            formData.durationIndex,
            formData.binance_fee_tier,
            startParts.date,
            startParts.hour,
            startParts.minute,
        );
    }

    /**
     * Create with sensible defaults
     */
    static default(): TwapParams {
        const defaultParts = getTwentyFourHoursAgoUtcParts();
        return new TwapParams(
            DEFAULT_TOKEN,
            DEFAULT_DIRECTION,
            DEFAULT_SIZE,
            DEFAULT_DURATION_INDEX,
            DEFAULT_BINANCE_TIER,
            defaultParts.date,
            defaultParts.hour,
            defaultParts.minute,
        );
    }

    /**
     * Computed getter for duration string
     */
    get duration(): string {
        return indexToDurationString(this.durationIndex);
    }

    /**
     * Computed getter for start time as Date
     */
    get startTime(): Date {
        return combineUtcDateTimeComponents(this.startDate, this.startHour, this.startMinute);
    }

    /**
     * Check if params are valid
     */
    isValid(): boolean {
        return validateTwapParams({
            durationIndex: this.durationIndex,
            size: this.size,
            startDate: this.startDate,
            startHour: this.startHour,
            startMinute: this.startMinute,
            token: this.token,
        });
    }

    /**
     * Convert to URL query string
     */
    toUrlString(): string {
        const params = new URLSearchParams({
            binanceTier: feeTierToUrlTier(this.binanceTier),
            direction: this.direction,
            duration: this.duration,
            size: this.size,
            startDate: this.startDate,
            startHour: this.startHour,
            startMinute: this.startMinute,
            token: this.token,
        });
        return params.toString();
    }

    /**
     * Convert to form data shape
     */
    toFormData(): {
        selectedBase: string;
        direction: "Buy" | "Sell";
        input_amount: string;
        durationIndex: number;
        binance_fee_tier: string;
        start_time: string;
    } {
        // Find token to get chainId
        const token = findTokenByTicker(this.token);
        const selectedBase = token ? `${token.ticker}:${token.chain}` : `${this.token}:1`;

        const start_time = formatUtcDateParts({
            date: this.startDate,
            hour: this.startHour,
            minute: this.startMinute,
        });

        return {
            binance_fee_tier: this.binanceTier,
            direction: this.direction === "buy" ? "Buy" : "Sell",
            durationIndex: this.durationIndex,
            input_amount: this.size,
            selectedBase,
            start_time,
        };
    }

    /**
     * Convert to server action parameters shape
     */
    toServerActionParams(): {
        selectedBase: string;
        direction: "Buy" | "Sell";
        input_amount: string;
        durationIndex: number;
        binance_fee_tier: string;
        start_time: string;
    } {
        // Find token to get chainId
        const token = findTokenByTicker(this.token);
        const selectedBase = token ? `${token.ticker}:${token.chain}` : `${this.token}:1`;

        return {
            binance_fee_tier: this.binanceTier,
            direction: this.direction === "buy" ? "Buy" : "Sell",
            durationIndex: this.durationIndex,
            input_amount: this.size,
            selectedBase,
            start_time: formatUtcDateParts({
                date: this.startDate,
                hour: this.startHour,
                minute: this.startMinute,
            }),
        };
    }
}
