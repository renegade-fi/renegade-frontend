"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import Image from "next/image";
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
import type { SimulateTwapResult, TwapFormData } from "../actions/simulate-twap-action";
import { BINANCE_FEE_TIERS, BINANCE_TAKER_BPS_BY_TIER } from "../lib/binance-fee-tiers";
import { DURATION_PRESETS } from "../lib/constants";
import { formatDateTimeForInput, getTwentyFourHoursAgo } from "../lib/date-utils";
import { getTokens } from "../lib/token-utils";
import { DateTimePicker } from "./date-time-picker";

// Get tokens once when module loads for stable reference
const tokens = getTokens();

const formSchema = z.object({
    binance_fee_tier: z.string(),
    direction: z.string(),
    durationIndex: z.number(),
    input_amount: z.string(),
    selectedBase: z.string(),
    start_time: z.string(),
});

interface TwapParameterFormProps {
    mutation: UseMutationResult<SimulateTwapResult, Error, TwapFormData>;
}

export function TwapParameterForm({ mutation }: TwapParameterFormProps) {
    // Get first token as default
    const firstToken = tokens[0];
    const defaultToken = `${firstToken.ticker}:${firstToken.chain}`;

    // Initialize form with React Hook Form
    const form = useForm<TwapFormData>({
        defaultValues: {
            binance_fee_tier: "No VIP",
            direction: "Buy",
            durationIndex: 3, // 1 hour
            input_amount: "10000.00",
            selectedBase: defaultToken,
            start_time: formatDateTimeForInput(getTwentyFourHoursAgo()),
        },
        mode: "onChange",
        resolver: zodResolver(formSchema),
    });

    const durationIndex = useWatch({
        control: form.control,
        name: "durationIndex",
    });
    const selectedDuration = DURATION_PRESETS[durationIndex];

    // --- Handlers --- //

    const handleSubmit = (data: TwapFormData) => {
        mutation.mutate(data);
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
                                        (BINANCE_TAKER_BPS_BY_TIER[tier] || 0.001) * 10000
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
                aria-busy={mutation.isPending}
                className="flex w-full font-serif text-2xl font-bold tracking-tighter lg:tracking-normal"
                disabled={mutation.isPending}
                size="xl"
                type="submit"
            >
                {mutation.isPending ? "Simulating..." : "Simulate TWAP"}
            </Button>
        </form>
    );
}
