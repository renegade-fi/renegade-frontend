"use client";

import type { ChainId } from "@renegade-fi/react/constants";
import { Token } from "@renegade-fi/token-nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { BINANCE_FEE_TIERS, BINANCE_TAKER_BPS_BY_TIER } from "../lib/binance-fee-tiers";
import {
    calculateDuration,
    calculateEndDate,
    formatDateTimeForInput,
    getTwentyFourHoursAgo,
} from "../lib/date-utils";
import { getTokens } from "../lib/token-utils";
import { TwapUrlParamsSchema } from "../lib/twap-server-client/api-types/twap";
import { convertDecimalToRaw, formatUnitsToNumber } from "../lib/utils";
import type { SearchParams } from "../page";
import { DateTimePicker } from "./date-time-picker";

// Get tokens once when module loads for stable reference
const tokens = getTokens();

// Duration presets for slider (7 discrete values)
const DURATION_PRESETS = [
    { hours: 0, label: "1 min", minutes: 1 },
    { hours: 0, label: "5 min", minutes: 5 },
    { hours: 0, label: "15 min", minutes: 15 },
    { hours: 1, label: "1 hour", minutes: 0 },
    { hours: 4, label: "4 hours", minutes: 0 },
    { hours: 12, label: "12 hours", minutes: 0 },
    { hours: 24, label: "24 hours", minutes: 0 },
];

interface TwapParameterFormProps {
    searchParams: SearchParams;
}

export function TwapParameterForm({ searchParams }: TwapParameterFormProps) {
    const router = useRouter();
    const parsed = TwapUrlParamsSchema.safeParse(searchParams);
    const defaults = parsed.success ? parsed.data : null;

    // --- Default Form Values --- //

    // Pre-populate form with existing values if they exist
    const [direction, setDirection] = React.useState(defaults?.direction ?? "Buy");

    // Binance fee tier selection (passthrough to URL params)
    const initialFeeTier =
        (Array.isArray(searchParams?.binance_fee_tier)
            ? searchParams?.binance_fee_tier[0]
            : (searchParams?.binance_fee_tier as string)) || "No VIP";
    const [binanceFeeTier, setBinanceFeeTier] = React.useState<string>(initialFeeTier);

    const feeTierToTakerBps = BINANCE_TAKER_BPS_BY_TIER as Record<string, number>;

    // Convert raw quote_amount (USDC) back to decimal for display
    const decimalQuoteAmount = React.useMemo(() => {
        const quoteAmount = defaults?.quote_amount;
        if (!quoteAmount) return "";
        const token = Token.fromTicker("USDC");
        if (!token) return quoteAmount;
        const decimalValue = formatUnitsToNumber(quoteAmount, token.decimals);
        const formatted = decimalValue.toString();
        return formatted.includes(".") ? formatted : `${formatted}.0`;
    }, [defaults?.quote_amount]);

    const firstToken = tokens[0];
    const defaultToken = `${firstToken.ticker}:${firstToken.chain}`;
    // Initialize selected base from URL defaults if present
    const initialSelectedBase = React.useMemo(() => {
        if (defaults?.base_ticker) {
            const token = tokens.find((t) => t.ticker === defaults.base_ticker) ?? tokens[0];
            return `${token.ticker}:${token.chain}`;
        }
        return defaultToken;
    }, [defaults?.base_ticker, defaultToken]);
    const [selectedBase, setSelectedBase] = React.useState(initialSelectedBase);

    // Keep selected base in sync if URL/base_mint changes without remount
    React.useEffect(() => {
        if (defaults?.base_ticker) {
            const token = tokens.find((t) => t.ticker === defaults.base_ticker);
            if (token) setSelectedBase(`${token.ticker}:${token.chain}`);
        }
    }, [defaults?.base_ticker]);

    // Find closest preset index from URL params, default to index 3 (1h)
    const initialDurationIndex = React.useMemo(() => {
        if (defaults?.start_time && defaults?.end_time) {
            const startDate = new Date(defaults.start_time);
            const endDate = new Date(defaults.end_time);
            const duration = calculateDuration(startDate, endDate);
            const totalMinutes = duration.hours * 60 + duration.minutes;

            // Find closest preset
            let closestIndex = 3; // Default to 1h
            let closestDiff = Number.POSITIVE_INFINITY;
            DURATION_PRESETS.forEach((preset, index) => {
                const presetMinutes = preset.hours * 60 + preset.minutes;
                const diff = Math.abs(presetMinutes - totalMinutes);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestIndex = index;
                }
            });
            return closestIndex;
        }
        return 3; // Default to 1h
    }, [defaults?.start_time, defaults?.end_time]);

    const [durationIndex, setDurationIndex] = React.useState(initialDurationIndex);
    const selectedDuration = DURATION_PRESETS[durationIndex];

    // Track route transition so the submit button can reflect pending state
    const [isPending, startTransition] = React.useTransition();

    // --- Handlers --- //

    // On submit, build the query parameters and navigate to the new page
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const params = buildQueryParams(formData, selectedBase);

        // Navigate with new query parameters inside a transition so we can
        // disable the button and show a loading label until data loads.
        startTransition(() => {
            router.push(`/twap?${params.toString()}`);
        });
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="flex bg-muted">
                        <Button
                            className="h-8 px-3"
                            onClick={() => setDirection("Buy")}
                            size="sm"
                            type="button"
                            variant={direction === "Buy" ? "default" : "ghost"}
                        >
                            Buy
                        </Button>
                        <Button
                            className="h-8 px-3"
                            onClick={() => setDirection("Sell")}
                            size="sm"
                            type="button"
                            variant={direction === "Sell" ? "default" : "ghost"}
                        >
                            Sell
                        </Button>
                    </div>
                    <Select onValueChange={setSelectedBase} required value={selectedBase}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                        <SelectContent>
                            {tokens.map((token) => (
                                <SelectItem
                                    key={`${token.address}-${token.chain}`}
                                    value={`${token.ticker}:${token.chain}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Image
                                            alt={token.ticker}
                                            className="w-5 h-5 rounded-full"
                                            height={20}
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                            }}
                                            src={token.logoUrl}
                                            width={20}
                                        />
                                        <span>{token.ticker}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <input name="direction" type="hidden" value={direction} />
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground" htmlFor="input_amount">
                    Amount
                </Label>
                <InputGroup>
                    <InputGroupInput
                        aria-label="Dollar amount"
                        className="text-sm"
                        defaultValue={decimalQuoteAmount || "100.0"}
                        id="input_amount"
                        inputMode="decimal"
                        min="0.0"
                        name="input_amount"
                        placeholder="100.00"
                        required
                        step="any"
                        type="number"
                    />
                    <InputGroupAddon align="inline-end">
                        <InputGroupText>USDC</InputGroupText>
                    </InputGroupAddon>
                </InputGroup>
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground" htmlFor="num_trades">
                    Number of Clips
                </Label>
                <Input
                    className="text-sm rounded-none"
                    defaultValue={defaults?.num_trades?.toString() ?? "10"}
                    id="num_trades"
                    min="1"
                    name="num_trades"
                    placeholder="4"
                    required
                    type="number"
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground" htmlFor="duration">
                        Duration
                    </Label>
                    <span className="text-sm ">{selectedDuration.label}</span>
                </div>
                <div className="p-1">
                    <Slider
                        max={6}
                        min={0}
                        onValueChange={(value) => setDurationIndex(value[0])}
                        step={1}
                        value={[durationIndex]}
                    />
                </div>
                <input
                    name="duration_hours"
                    type="hidden"
                    value={selectedDuration.hours.toString()}
                />
                <input
                    name="duration_minutes"
                    type="hidden"
                    value={selectedDuration.minutes.toString()}
                />
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground" htmlFor="start_time">
                    Start Time
                </Label>
                <DateTimePicker
                    defaultValue={
                        defaults?.start_time
                            ? formatDateTimeForInput(new Date(defaults.start_time))
                            : formatDateTimeForInput(getTwentyFourHoursAgo())
                    }
                    id="start_time"
                    name="start_time"
                />
            </div>

            {/* Binance fee tier selection */}
            <div className="space-y-2">
                <Label className="text-muted-foreground" htmlFor="binance_fee_tier">
                    Binance Fee Tier
                </Label>
                <Select onValueChange={setBinanceFeeTier} value={binanceFeeTier}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select fee tier" />
                    </SelectTrigger>
                    <SelectContent>
                        {BINANCE_FEE_TIERS.map((tier) => {
                            const feeBps = ((feeTierToTakerBps[tier] || 0.001) * 10000).toFixed(1);
                            return (
                                <SelectItem key={tier} value={tier}>
                                    {tier} - {feeBps} bps
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                <input name="binance_fee_tier" type="hidden" value={binanceFeeTier} />
                <input
                    name="binance_taker_bps"
                    type="hidden"
                    value={feeTierToTakerBps[binanceFeeTier]?.toString() ?? "10"}
                />
            </div>

            <Button
                aria-busy={isPending}
                className="flex w-full font-serif text-2xl font-bold tracking-tighter lg:tracking-normal"
                disabled={isPending}
                size="xl"
                type="submit"
            >
                {isPending ? "Simulating..." : "Simulate TWAP"}
            </Button>
        </form>
    );
}

// --------------------
// | Helper Functions |
// --------------------

/**
 * Build query parameters from form data for TWAP simulation
 */
function buildQueryParams(formData: FormData, selectedBase: string): URLSearchParams {
    // Parse the compound value to get ticker and chain
    // Sent from the form in the format `ticker:chain`
    const baseTickerAndChain = (formData.get("base_ticker") as string) || selectedBase;
    const [ticker, chain] = baseTickerAndChain.split(":");
    const chainId = Number(chain) as ChainId;

    // 1. Set the base and quote tickers
    const params = new URLSearchParams();
    const baseToken = Token.fromTickerOnChain(ticker, chainId);
    params.set("base_ticker", baseToken.ticker);

    // 2. Set the direction
    const direction = formData.get("direction") as string;
    params.set("direction", direction);

    // 3. Set the input amount (always in dollars/quote)
    const inputAmount = Number(formData.get("input_amount"));
    const usdc = Token.fromTickerOnChain("USDC", chainId);
    const quoteRaw = convertDecimalToRaw(inputAmount, usdc.decimals);
    params.set("base_amount", "0");
    params.set("quote_amount", quoteRaw.toString());

    // 4. Set the start and end times
    const startTimeValue = formData.get("start_time") as string;
    const durationHours = parseInt((formData.get("duration_hours") as string) || "0", 10);
    const durationMinutes = parseInt((formData.get("duration_minutes") as string) || "0", 10);
    const startTime = new Date(startTimeValue);
    const endTime = calculateEndDate(startTime, durationHours, durationMinutes);
    params.set("start_time", startTime.toISOString());
    params.set("end_time", endTime.toISOString());

    // 5. Set the number of trades
    params.set("num_trades", formData.get("num_trades") as string);

    // 6. Pass through Binance fee tier selection for downstream usage
    const feeTier = (formData.get("binance_fee_tier") as string) || "No VIP";
    params.set("binance_fee_tier", feeTier);
    const takerBps = (formData.get("binance_taker_bps") as string) || "10";
    params.set("binance_taker_bps", takerBps);
    return params;
}
