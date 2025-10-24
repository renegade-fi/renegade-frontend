"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ChainId } from "@renegade-fi/react/constants";
import { Token } from "@renegade-fi/token-nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import numeral from "numeral";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
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
import { convertDecimalToRaw } from "../lib/utils";
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

const formSchema = z.object({
    binance_fee_tier: z.string(),
    direction: z.string(),
    durationIndex: z.number(),
    input_amount: z.string(),
    selectedBase: z.string(),
    start_time: z.string(),
});

interface TwapParameterFormProps {
    searchParams: SearchParams;
}

export function TwapParameterForm({ searchParams }: TwapParameterFormProps) {
    const router = useRouter();
    const parsed = TwapUrlParamsSchema.safeParse(searchParams);
    const defaults = parsed.success ? parsed.data : null;

    // --- Default Form Values --- //

    // Binance fee tier selection (passthrough to URL params)
    const initialFeeTier =
        (Array.isArray(searchParams?.binance_fee_tier)
            ? searchParams?.binance_fee_tier[0]
            : (searchParams?.binance_fee_tier as string)) || "No VIP";

    const feeTierToTakerBps = BINANCE_TAKER_BPS_BY_TIER as Record<string, number>;

    // Convert raw quote_amount (USDC) back to decimal for display
    const decimalQuoteAmount = React.useMemo(() => {
        const quoteAmount = defaults?.quote_amount;
        if (!quoteAmount) return "";
        const token = Token.fromTicker("USDC");
        if (!token) return quoteAmount;
        const decimalValue = token.convertToDecimal(BigInt(quoteAmount));
        return numeral(decimalValue).format("0[.]00");
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

    // Initialize form with React Hook Form
    const form = useForm<z.infer<typeof formSchema>>({
        defaultValues: {
            binance_fee_tier: initialFeeTier,
            direction: defaults?.direction ?? "Buy",
            durationIndex: initialDurationIndex,
            input_amount: decimalQuoteAmount || "100.00",
            selectedBase: initialSelectedBase,
            start_time: defaults?.start_time
                ? formatDateTimeForInput(new Date(defaults.start_time))
                : formatDateTimeForInput(getTwentyFourHoursAgo()),
        },
        mode: "onChange",
        resolver: zodResolver(formSchema),
    });

    const durationIndex = useWatch({
        control: form.control,
        name: "durationIndex",
    });
    const selectedDuration = DURATION_PRESETS[durationIndex];

    // Track route transition so the submit button can reflect pending state
    const [isPending, startTransition] = React.useTransition();

    // --- Handlers --- //

    // On submit, build the query parameters and navigate to the new page
    const handleSubmit = (data: z.infer<typeof formSchema>) => {
        const params = buildQueryParams(data);

        // Navigate with new query parameters inside a transition so we can
        // disable the button and show a loading label until data loads.
        startTransition(() => {
            router.push(`/twap?${params.toString()}`);
        });
    };

    return (
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Controller
                        control={form.control}
                        name="direction"
                        render={({ field }) => (
                            <div className="flex bg-muted">
                                <Button
                                    className="h-8 px-3"
                                    onClick={() => field.onChange("Buy")}
                                    size="sm"
                                    type="button"
                                    variant={field.value === "Buy" ? "default" : "ghost"}
                                >
                                    Buy
                                </Button>
                                <Button
                                    className="h-8 px-3"
                                    onClick={() => field.onChange("Sell")}
                                    size="sm"
                                    type="button"
                                    variant={field.value === "Sell" ? "default" : "ghost"}
                                >
                                    Sell
                                </Button>
                            </div>
                        )}
                    />
                    <Controller
                        control={form.control}
                        name="selectedBase"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} required value={field.value}>
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
                        )}
                    />
                </div>
            </div>

            <Controller
                control={form.control}
                name="input_amount"
                render={({ field }) => (
                    <Field className="space-y-2">
                        <FieldLabel className="text-muted-foreground" htmlFor="input_amount">
                            Amount
                        </FieldLabel>
                        <InputGroup>
                            <InputGroupInput
                                {...field}
                                aria-label="Dollar amount"
                                className="text-sm"
                                id="input_amount"
                                inputMode="decimal"
                                min="0.0"
                                placeholder="100.00"
                                required
                                step="any"
                                type="number"
                            />
                            <InputGroupAddon align="inline-end">
                                <InputGroupText>USDC</InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                    </Field>
                )}
            />

            <Controller
                control={form.control}
                name="durationIndex"
                render={({ field }) => (
                    <Field className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FieldLabel className="text-muted-foreground">Duration</FieldLabel>
                            <span className="text-sm ">{selectedDuration.label}</span>
                        </div>
                        <div className="p-1">
                            <Slider
                                max={6}
                                min={0}
                                onValueChange={(value) => field.onChange(value[0])}
                                step={1}
                                value={[field.value]}
                            />
                        </div>
                    </Field>
                )}
            />

            <Controller
                control={form.control}
                name="start_time"
                render={({ field }) => (
                    <Field className="space-y-2">
                        <FieldLabel className="text-muted-foreground" htmlFor="start_time">
                            Start Time
                        </FieldLabel>
                        <DateTimePicker id="start_time" {...field} />
                    </Field>
                )}
            />

            {/* Binance fee tier selection */}
            <Controller
                control={form.control}
                name="binance_fee_tier"
                render={({ field }) => (
                    <Field className="space-y-2">
                        <FieldLabel className="text-muted-foreground">Binance Fee Tier</FieldLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select fee tier" />
                            </SelectTrigger>
                            <SelectContent>
                                {BINANCE_FEE_TIERS.map((tier) => {
                                    const feeBps = (
                                        (feeTierToTakerBps[tier] || 0.001) * 10000
                                    ).toFixed(1);
                                    return (
                                        <SelectItem key={tier} value={tier}>
                                            {tier} - {feeBps} bps
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </Field>
                )}
            />

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
function buildQueryParams(data: z.infer<typeof formSchema>): URLSearchParams {
    // Parse the compound value to get ticker and chain
    // Sent from the form in the format `ticker:chain`
    const [ticker, chain] = data.selectedBase.split(":");
    const chainId = Number(chain) as ChainId;

    // 1. Set the base and quote tickers
    const params = new URLSearchParams();
    const baseToken = Token.fromTickerOnChain(ticker, chainId);
    params.set("base_ticker", baseToken.ticker);

    // 2. Set the direction
    params.set("direction", data.direction);

    // 3. Set the input amount (always in dollars/quote)
    const inputAmount = Number(data.input_amount);
    const usdc = Token.fromTickerOnChain("USDC", chainId);
    const quoteRaw = convertDecimalToRaw(inputAmount, usdc.decimals);
    params.set("base_amount", "0");
    params.set("quote_amount", quoteRaw.toString());

    // 4. Set the start and end times
    const selectedDuration = DURATION_PRESETS[data.durationIndex];
    const durationHours = selectedDuration.hours;
    const durationMinutes = selectedDuration.minutes;
    const startTime = new Date(data.start_time);
    const endTime = calculateEndDate(startTime, durationHours, durationMinutes);
    params.set("start_time", startTime.toISOString());
    params.set("end_time", endTime.toISOString());

    // 5. Calculate number of trades from duration (30 seconds per clip)
    const totalSeconds = durationHours * 3600 + durationMinutes * 60;
    const numberOfTrades = Math.max(1, Math.floor(totalSeconds / 30));
    params.set("num_trades", numberOfTrades.toString());

    // 6. Pass through Binance fee tier selection for downstream usage
    params.set("binance_fee_tier", data.binance_fee_tier);
    const feeTierToTakerBps = BINANCE_TAKER_BPS_BY_TIER as Record<string, number>;
    const takerBps = feeTierToTakerBps[data.binance_fee_tier]?.toString() ?? "10";
    params.set("binance_taker_bps", takerBps);
    return params;
}
