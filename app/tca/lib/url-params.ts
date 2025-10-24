import type { ChainId } from "@renegade-fi/react/constants";
import { Token } from "@renegade-fi/token-nextjs";
import { BINANCE_TAKER_BPS_BY_TIER, type BinanceFeeTier } from "./binance-fee-tiers";
import { DURATION_PRESETS } from "./constants";
import {
    calculateEndDate,
    combineUtcDateTimeComponents,
    formatUtcDateParts,
    getTwentyFourHoursAgoUtcParts,
    parseIsoToUtcParts,
} from "./date-utils";
import { findTokenByTicker } from "./token-utils";
import { TwapParamsSchema as TwapServerParamsSchema } from "./twap-server-client/api-types/twap";
import { convertDecimalToRaw } from "./utils";
import { validateTwapParams } from "./validation";

const DEFAULT_TOKEN = "WETH";
const DEFAULT_DIRECTION: "buy" = "buy";
const DEFAULT_SIZE = "10000";
const DEFAULT_DURATION_INDEX = 3;
const DEFAULT_BINANCE_TIER = "No VIP";
const FALLBACK_CHAIN_ID = 1;

function urlTierToFeeTier(urlTier: string | undefined): string {
    if (!urlTier) return "No VIP";
    const match = urlTier.match(/^vip(\d+)$/i);
    if (!match) return "No VIP";
    const num = Number.parseInt(match[1] ?? "0", 10);
    if (num === 0) return "No VIP";
    if (num >= 1 && num <= 9) return `VIP ${num}`;
    return "No VIP";
}

function feeTierToUrlTier(feeTier: string): string {
    if (feeTier === "No VIP") return "vip0";
    const match = feeTier.match(/^VIP (\d+)$/i);
    if (!match) return "vip0";
    return `vip${match[1]}`;
}

function durationStringToIndex(duration: string | undefined): number {
    if (!duration) return DEFAULT_DURATION_INDEX;
    const lower = duration.toLowerCase();

    const mapping: Record<string, number> = {
        "1h": 3,
        "1m": 0,
        "4h": 4,
        "5m": 1,
        "12h": 5,
        "15m": 2,
        "24h": 6,
    };

    return mapping[lower] ?? DEFAULT_DURATION_INDEX;
}

function indexToDurationString(index: number): string {
    const mapping = ["1m", "5m", "15m", "1h", "4h", "12h", "24h"];
    return mapping[index] ?? mapping[DEFAULT_DURATION_INDEX];
}

export class TwapParams {
    private constructor(
        public readonly token: string,
        public readonly chainId: number,
        public readonly direction: "buy" | "sell",
        public readonly size: string,
        public readonly durationIndex: number,
        public readonly binanceTier: string,
        public readonly startDate: string,
        public readonly startHour: string,
        public readonly startMinute: string,
    ) {}

    // Canonicalization helpers scoped to this class
    private static normalizeDirection(direction: string): "buy" | "sell" {
        return direction.toLowerCase() === "sell" ? "sell" : "buy";
    }

    private static normalizeTicker(ticker: string): string {
        return ticker.trim().toUpperCase();
    }

    private static normalizeSelectedBase(selectedBase: string): {
        ticker: string;
        chainId: number;
    } {
        const [rawTicker = "", rawChain = ""] = selectedBase.split(":");
        const ticker = TwapParams.normalizeTicker(rawTicker);
        const chainId = Number(rawChain) || FALLBACK_CHAIN_ID;
        return { chainId, ticker };
    }

    private static toCanonicalNumberString(n: number): string {
        let s = Number.isFinite(n) ? n.toString() : "";
        if (!s || s.includes("e") || s.includes("E")) {
            s = n.toFixed(12);
        }
        s = s.replace(/\.0+$/, "");
        s = s.replace(/(\.[0-9]*?)0+$/, "$1");
        s = s.replace(/\.$/, "");
        return s;
    }

    private static normalizeAmountString(amount: string): string {
        const cleaned = amount.replace(/,/g, "").trim();
        const n = Number.parseFloat(cleaned);
        if (!Number.isFinite(n)) return cleaned;
        if (n === 0) return "0";
        return TwapParams.toCanonicalNumberString(n);
    }

    private static pad2(v: string | number): string {
        const s = typeof v === "number" ? String(v) : v;
        return s.padStart(2, "0");
    }

    static fromUrl(searchParams: Record<string, string | string[] | undefined>): TwapParams {
        const token = typeof searchParams.token === "string" ? searchParams.token : DEFAULT_TOKEN;
        const resolvedToken = findTokenByTicker(token);
        const chainId = resolvedToken?.chain ?? FALLBACK_CHAIN_ID;
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
            chainId,
            direction,
            size,
            durationIndex,
            binanceTier,
            startDate,
            startHour,
            startMinute,
        );
    }

    static fromFormData(formData: {
        selectedBase: string;
        direction: "Buy" | "Sell";
        input_amount: string;
        durationIndex: number;
        binance_fee_tier: string;
        start_time: string;
    }): TwapParams {
        // Normalize base selection
        const { ticker, chainId } = TwapParams.normalizeSelectedBase(formData.selectedBase);
        // Normalize direction
        const direction = TwapParams.normalizeDirection(formData.direction);
        // Normalize amount string
        const size = TwapParams.normalizeAmountString(formData.input_amount);
        // Normalize start time parts
        const startParts = parseIsoToUtcParts(formData.start_time);
        const startDate = startParts.date;
        const startHour = TwapParams.pad2(startParts.hour);
        const startMinute = TwapParams.pad2(startParts.minute);

        return new TwapParams(
            TwapParams.normalizeTicker(ticker),
            chainId || FALLBACK_CHAIN_ID,
            direction,
            size,
            formData.durationIndex,
            formData.binance_fee_tier,
            startDate,
            startHour,
            startMinute,
        );
    }

    static default(): TwapParams {
        const defaultToken = findTokenByTicker(DEFAULT_TOKEN);
        const defaultChainId = defaultToken?.chain ?? FALLBACK_CHAIN_ID;
        const defaultParts = getTwentyFourHoursAgoUtcParts();

        return new TwapParams(
            DEFAULT_TOKEN,
            defaultChainId,
            DEFAULT_DIRECTION,
            DEFAULT_SIZE,
            DEFAULT_DURATION_INDEX,
            DEFAULT_BINANCE_TIER,
            defaultParts.date,
            defaultParts.hour,
            defaultParts.minute,
        );
    }

    get duration(): string {
        return indexToDurationString(this.durationIndex);
    }

    get startTime(): Date {
        return combineUtcDateTimeComponents(this.startDate, this.startHour, this.startMinute);
    }

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

    toCanonicalObject(): Record<string, string | number> {
        return {
            binanceTier: this.binanceTier,
            chainId: this.chainId,
            direction: TwapParams.normalizeDirection(this.direction),
            durationIndex: this.durationIndex,
            size: TwapParams.normalizeAmountString(this.size),
            startDate: this.startDate,
            startHour: TwapParams.pad2(this.startHour),
            startMinute: TwapParams.pad2(this.startMinute),
            token: TwapParams.normalizeTicker(this.token),
        };
    }

    toCanonicalKey(): string {
        const o = this.toCanonicalObject();
        // Stable key order
        return [
            `token:${o.token}`,
            `chain:${o.chainId}`,
            `dir:${o.direction}`,
            `amt:${o.size}`,
            `durIdx:${o.durationIndex}`,
            `tier:${o.binanceTier}`,
            `date:${o.startDate}`,
            `h:${o.startHour}`,
            `m:${o.startMinute}`,
        ].join("|");
    }

    toFormData(): {
        selectedBase: string;
        direction: "Buy" | "Sell";
        input_amount: string;
        durationIndex: number;
        binance_fee_tier: string;
        start_time: string;
    } {
        return {
            binance_fee_tier: this.binanceTier,
            direction: this.direction === "buy" ? "Buy" : "Sell",
            durationIndex: this.durationIndex,
            input_amount: this.size,
            selectedBase: `${this.token}:${this.chainId}`,
            start_time: formatUtcDateParts({
                date: this.startDate,
                hour: this.startHour,
                minute: this.startMinute,
            }),
        };
    }

    toServerActionParams(): {
        selectedBase: string;
        direction: "Buy" | "Sell";
        input_amount: string;
        durationIndex: number;
        binance_fee_tier: string;
        start_time: string;
    } {
        return this.toFormData();
    }

    toSimulationPayload(): {
        params: ReturnType<typeof TwapServerParamsSchema.parse>;
        binanceFee: number;
    } {
        const chainId = this.chainId as ChainId;
        const baseToken = Token.fromTickerOnChain(this.token, chainId);
        const quoteToken = Token.fromTickerOnChain("USDC", chainId);

        if (baseToken.ticker === "UNKNOWN" || quoteToken.ticker === "UNKNOWN") {
            throw new Error("Invalid token selection");
        }

        const amount = Number(this.size);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("Invalid quote amount");
        }

        const quoteRaw = convertDecimalToRaw(amount, quoteToken.decimals);
        const duration =
            DURATION_PRESETS[this.durationIndex] ?? DURATION_PRESETS[DEFAULT_DURATION_INDEX];

        const startTime = this.startTime;
        const endTime = calculateEndDate(startTime, duration.hours, duration.minutes);
        const totalSeconds = duration.hours * 3600 + duration.minutes * 60;
        const numberOfTrades = Math.max(1, Math.floor(totalSeconds / 30));

        const params = TwapServerParamsSchema.parse({
            base_amount: "0",
            base_mint: baseToken.address,
            direction: this.direction === "buy" ? "Buy" : "Sell",
            end_time: endTime.toISOString(),
            num_trades: numberOfTrades,
            quote_amount: quoteRaw.toString(),
            quote_mint: quoteToken.address,
            start_time: startTime.toISOString(),
        });

        const binanceFee =
            BINANCE_TAKER_BPS_BY_TIER[this.binanceTier as BinanceFeeTier] ??
            BINANCE_TAKER_BPS_BY_TIER["No VIP"];

        return { binanceFee, params };
    }
}
