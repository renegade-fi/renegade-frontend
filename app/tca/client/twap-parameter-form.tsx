"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
import { DURATION_PRESETS } from "../lib/constants";
import {
    validateEndTimeNotInFuture,
    validateStartDateNotBeforeCutoff,
    validateTradeSizeInRange,
} from "../lib/form-validation";
import { getTokens } from "../lib/token-utils";
import { TwapParams } from "../lib/url-params";
import { formatUSDC } from "../lib/utils";
import { DateTimePicker } from "./date-time-picker";

// Get tokens once when module loads for stable reference
const tokens = getTokens();

const formSchema = z
    .object({
        binance_fee_tier: z.string(),
        direction: z.enum(["Buy", "Sell"]),
        durationIndex: z.number(),
        input_amount: z.string(),
        selectedBase: z.string(),
        start_time: z.string(),
    })
    .refine(validateEndTimeNotInFuture, {
        message: "End time must not be in the future",
        path: ["start_time"],
    })
    .refine(validateStartDateNotBeforeCutoff, {
        message: "Start date must be on or after October 24th, 2025",
        path: ["start_time"],
    })
    .superRefine((data, ctx) => {
        if (!validateTradeSizeInRange(data)) {
            const duration = DURATION_PRESETS[data.durationIndex];
            const durationSeconds = duration.hours * 3600 + duration.minutes * 60;
            const numberOfTrades = durationSeconds / 30;
            const minAmount = numberOfTrades;
            const maxAmount = numberOfTrades * 250000;

            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Amount must be between ${formatUSDC(minAmount)} and ${formatUSDC(maxAmount)} USDC for the chosen duration of ${duration.label}.`,
                path: ["input_amount"],
            });
        }
    });

type TwapFormData = z.infer<typeof formSchema>;

interface TwapParameterFormProps {
    initialFormData: TwapFormData;
}

export function TwapParameterForm({ initialFormData }: TwapParameterFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Initialize form with values from URL params
    const form = useForm<TwapFormData>({
        defaultValues: initialFormData,
        mode: "all",
        resolver: zodResolver(formSchema),
    });

    const durationIndex = useWatch({
        control: form.control,
        name: "durationIndex",
    });
    const selectedDuration = DURATION_PRESETS[durationIndex];

    // Track focus state for amount input formatting
    const [isAmountFocused, setIsAmountFocused] = useState(false);

    // Re-validate dependent fields when duration changes
    // start_time and input_amount validation both depend on durationIndex
    // biome-ignore lint/correctness/useExhaustiveDependencies: durationIndex is needed to trigger revalidation
    useEffect(() => {
        void form.trigger(["start_time", "input_amount"]);
    }, [durationIndex, form]);

    // --- Handlers --- //

    const handleSubmit = (data: TwapFormData) => {
        startTransition(() => {
            router.push(`/tca?${TwapParams.fromFormData(data).toUrlString()}`);
        });
    };

    return (
        <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <div>
                <div className="flex items-center gap-2">
                    <Controller
                        control={form.control}
                        name="direction"
                        render={({ field }) => (
                            <div className="flex bg-muted">
                                <Button
                                    onClick={() => field.onChange("Buy")}
                                    size="sm"
                                    type="button"
                                    variant={field.value === "Buy" ? "default" : "ghost"}
                                >
                                    Buy
                                </Button>
                                <Button
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
                render={({ field, fieldState }) => {
                    // Format display value: raw when focused, formatted when blurred
                    let displayValue: string;
                    if (isAmountFocused) {
                        // While typing, show raw value to allow natural decimal input
                        displayValue = field.value;
                    } else {
                        displayValue = formatUSDC(Number.parseFloat(field.value) || 0);
                    }

                    return (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel className="text-muted-foreground" htmlFor="input_amount">
                                Amount
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    {...field}
                                    aria-invalid={fieldState.invalid}
                                    aria-label="Dollar amount"
                                    className="text-sm"
                                    id="input_amount"
                                    inputMode="decimal"
                                    min="0.0"
                                    onBlur={(e) => {
                                        setIsAmountFocused(false);
                                        // Clean up trailing zeroes when done editing
                                        const numValue = Number.parseFloat(field.value);
                                        if (!Number.isNaN(numValue)) {
                                            field.onChange(String(numValue));
                                        }
                                        field.onBlur();
                                    }}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    onFocus={(e) => {
                                        setIsAmountFocused(true);
                                        // Select all text on focus for easier editing
                                        e.target.select();
                                    }}
                                    placeholder="100.00"
                                    required
                                    step="any"
                                    type="text"
                                    value={displayValue}
                                />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupText>USDC</InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                            {fieldState.invalid && (
                                <FieldError className="break-words" errors={[fieldState.error]} />
                            )}
                        </Field>
                    );
                }}
            />

            <Controller
                control={form.control}
                name="durationIndex"
                render={({ field }) => (
                    <Field>
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
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="text-muted-foreground" htmlFor="start_time">
                            Start Time
                        </FieldLabel>
                        <DateTimePicker id="start_time" {...field} />
                        {fieldState.invalid && (
                            <FieldError className="break-words" errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            {/* Binance fee tier selection */}
            <Controller
                control={form.control}
                name="binance_fee_tier"
                render={({ field }) => (
                    <Field>
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
                className="flex w-full font-serif text-2xl font-bold tracking-tighter lg:tracking-normal"
                disabled={isPending || !form.formState.isValid}
                size="xl"
                type="submit"
            >
                {isPending ? (
                    <>
                        <Loader2 aria-hidden className="mr-2 h-5 w-5 animate-spin" />
                        Simulating…
                    </>
                ) : (
                    "Simulate TWAP"
                )}
            </Button>
        </form>
    );
}
