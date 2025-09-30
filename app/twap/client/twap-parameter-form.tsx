"use client";

import type { ChainId } from "@renegade-fi/react/constants";
import { Token } from "@renegade-fi/token-nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    // Amount entry mode defaulted by presence of non-zero quote_amount
    const initialAmountMode: "base" | "quote" =
        Number.parseFloat(defaults?.quote_amount ?? "0") > 0 ? "quote" : "base";
    const [amountMode, setAmountMode] = React.useState<"base" | "quote">(initialAmountMode);

    // Binance fee tier selection (passthrough to URL params)
    const initialFeeTier =
        (Array.isArray(searchParams?.binance_fee_tier)
            ? searchParams?.binance_fee_tier[0]
            : (searchParams?.binance_fee_tier as string)) || "No VIP";
    const [binanceFeeTier, setBinanceFeeTier] = React.useState<string>(initialFeeTier);

    const feeTierToTakerBps = BINANCE_TAKER_BPS_BY_TIER as Record<string, number>;

    // Convert raw base_amount back to decimal for display
    const decimalBaseAmount = React.useMemo(() => {
        const baseAmount = defaults?.base_amount;
        if (!baseAmount) return "";
        const token = defaults?.base_ticker ? Token.fromTicker(defaults.base_ticker) : undefined;
        if (!token) return baseAmount;

        const decimalValue = formatUnitsToNumber(baseAmount, token.decimals);
        const formatted = decimalValue.toString();
        return formatted.includes(".") ? formatted : `${formatted}.0`;
    }, [defaults?.base_amount, defaults?.base_ticker]);

    // Convert raw quote_amount (USDC) back to decimal for display when in $ mode
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
    const selectedBaseTicker = React.useMemo(() => selectedBase.split(":")[0], [selectedBase]);

    // Keep selected base in sync if URL/base_mint changes without remount
    React.useEffect(() => {
        if (defaults?.base_ticker) {
            const token = tokens.find((t) => t.ticker === defaults.base_ticker);
            if (token) setSelectedBase(`${token.ticker}:${token.chain}`);
        }
    }, [defaults?.base_ticker]);

    // Calculate duration from start_time and end_time if they exist
    const durationDefaults = React.useMemo(() => {
        if (defaults?.start_time && defaults?.end_time) {
            const startDate = new Date(defaults.start_time);
            const endDate = new Date(defaults.end_time);
            return calculateDuration(startDate, endDate);
        }
        return { hours: 3, minutes: 0 };
    }, [defaults?.start_time, defaults?.end_time]);

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
                <Label>Trade</Label>
                <div className="flex gap-2">
                    <div className="flex bg-muted rounded-md p-1">
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
                <Label htmlFor="input_amount">Amount</Label>
                <div className="flex gap-2 items-center">
                    <Input
                        aria-label={amountMode === "quote" ? "Dollar amount" : "Token amount"}
                        className="text-sm"
                        defaultValue={
                            initialAmountMode === "quote"
                                ? decimalQuoteAmount || ""
                                : decimalBaseAmount || "1.0"
                        }
                        id="input_amount"
                        inputMode="decimal"
                        min="0.0"
                        name="input_amount"
                        placeholder={amountMode === "quote" ? "100.00" : "10.0"}
                        required
                        step="any"
                        type="number"
                    />

                    {/* Toggle between entering base tokens vs dollars (quote) */}
                    <div className="flex bg-muted rounded-md p-1">
                        <Button
                            className="h-8 px-3"
                            onClick={() => setAmountMode("base")}
                            size="sm"
                            type="button"
                            variant={amountMode === "base" ? "default" : "ghost"}
                        >
                            {selectedBaseTicker}
                        </Button>
                        <Button
                            className="h-8 px-3"
                            onClick={() => setAmountMode("quote")}
                            size="sm"
                            title="Enter amount in dollars"
                            type="button"
                            variant={amountMode === "quote" ? "default" : "ghost"}
                        >
                            $
                        </Button>
                    </div>
                </div>
                {/* Submit the selected mode so the server params are built correctly */}
                <input name="amount_mode" type="hidden" value={amountMode} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="num_trades">Number of Clips</Label>
                <Input
                    className="text-sm"
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
                <Label>Duration</Label>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            className="text-sm"
                            defaultValue={durationDefaults.hours.toString()}
                            id="duration_hours"
                            min="0"
                            name="duration_hours"
                            placeholder="3"
                            type="number"
                        />
                        <Label
                            className="text-xs text-muted-foreground mt-1 block"
                            htmlFor="duration_hours"
                        >
                            Hours
                        </Label>
                    </div>
                    <div className="flex-1">
                        <Input
                            className="text-sm"
                            defaultValue={durationDefaults.minutes.toString()}
                            id="duration_minutes"
                            max="59"
                            min="0"
                            name="duration_minutes"
                            placeholder="0"
                            type="number"
                        />
                        <Label
                            className="text-xs text-muted-foreground mt-1 block"
                            htmlFor="duration_minutes"
                        >
                            Minutes
                        </Label>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
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
                <Label>Binance Fee Tier</Label>
                <Select onValueChange={setBinanceFeeTier} value={binanceFeeTier}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select fee tier" />
                    </SelectTrigger>
                    <SelectContent>
                        {BINANCE_FEE_TIERS.map((tier) => (
                            <SelectItem key={tier} value={tier}>
                                {tier}
                            </SelectItem>
                        ))}
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
                className="w-full mt-6"
                disabled={isPending}
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

    // 3. Set the input amount according to selected mode
    const amountMode = formData.get("amount_mode") as string;
    const inputAmount = Number(formData.get("input_amount"));
    if (amountMode === "quote") {
        // Entered in dollars: convert to quote raw units, zero base_amount
        const usdc = Token.fromTickerOnChain("USDC", chainId);
        const quoteRaw = convertDecimalToRaw(inputAmount, usdc.decimals);
        params.set("base_amount", "0");
        params.set("quote_amount", quoteRaw.toString());
    } else {
        // Entered in tokens: convert to base raw units, zero quote_amount
        const baseRaw = convertDecimalToRaw(inputAmount, baseToken.decimals);
        params.set("base_amount", baseRaw.toString());
        params.set("quote_amount", "0");
    }

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
