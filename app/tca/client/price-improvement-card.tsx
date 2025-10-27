"use client";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PriceImprovementData } from "../actions/get-price-improvement";
import { ChartSkeleton } from "./chart-skeleton";

interface PriceImprovementCardProps {
    data: PriceImprovementData;
}

function getTokenAmountFormat(value: number, ticker: string) {
    const isUSDC = ticker === "USDC";

    if (isUSDC) {
        const absValue = Math.abs(value);
        // If less than 1 cent, show < 0.01
        if (absValue > 0 && absValue < 0.01) {
            return {
                format: { maximumFractionDigits: 2, minimumFractionDigits: 2 },
                prefix: "< ",
            };
        }
        // Check if whole number
        if (Math.abs(value - Math.round(value)) < 0.01) {
            return {
                format: { maximumFractionDigits: 0, minimumFractionDigits: 0 },
            };
        }
        return {
            format: { maximumFractionDigits: 2, minimumFractionDigits: 2 },
        };
    }

    // For non-USDC: find decimals needed for first sig fig
    const absValue = Math.abs(value);
    if (absValue >= 1 || absValue === 0) {
        // Whole number or zero
        return {
            format: { maximumFractionDigits: 0, minimumFractionDigits: 0 },
        };
    }

    // Calculate decimals needed
    const decimalsNeeded = Math.ceil(-Math.log10(absValue));
    return {
        format: {
            maximumFractionDigits: decimalsNeeded,
            minimumFractionDigits: decimalsNeeded,
        },
    };
}

export function PriceImprovementCardInner({ data }: PriceImprovementCardProps) {
    const {
        cumulativeDeltaBps,
        cumulativeBinanceReceived,
        cumulativeRenegadeReceived,
        receivedTicker,
    } = data;

    const improvementAmount = cumulativeRenegadeReceived - cumulativeBinanceReceived;

    const [displayBps, setDisplayBps] = useState(0);
    const [displayAmount, setDisplayAmount] = useState(0);

    // Animate from 0 to the actual values on mount
    useEffect(() => {
        // Small delay to ensure component is mounted and ready
        const timer = setTimeout(() => {
            setDisplayBps(cumulativeDeltaBps);
            setDisplayAmount(improvementAmount);
        }, 100);

        return () => clearTimeout(timer);
    }, [cumulativeDeltaBps, improvementAmount]);

    const tokenAmountFormatConfig = getTokenAmountFormat(displayAmount, receivedTicker);
    const isLessThanOneCent =
        receivedTicker === "USDC" && Math.abs(displayAmount) > 0 && Math.abs(displayAmount) < 0.01;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Price Improvement</CardTitle>
                <CardDescription>
                    Trades crossed through Renegade give strictly better execution than Binance,
                    saving on spreads, impact, and fees.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 grid place-items-center">
                <NumberFlowGroup>
                    <div className="grid grid-cols-1 place-items-center">
                        <NumberFlow
                            className={`text-4xl font-bold ${cumulativeDeltaBps > 0 ? "text-green-price" : ""}`}
                            format={{
                                maximumFractionDigits: 2,
                            }}
                            suffix=" bps"
                            value={displayBps}
                        />
                        <NumberFlow
                            className="text-lg font-bold"
                            format={tokenAmountFormatConfig.format}
                            prefix={
                                tokenAmountFormatConfig.prefix
                                    ? `(${tokenAmountFormatConfig.prefix}`
                                    : "("
                            }
                            suffix={` ${receivedTicker})`}
                            value={isLessThanOneCent ? 0.01 : displayAmount}
                        />
                    </div>
                </NumberFlowGroup>
            </CardContent>
        </Card>
    );
}

const PriceImprovementCardLazy = dynamic(
    () =>
        import("./price-improvement-card").then((mod) => ({
            default: mod.PriceImprovementCardInner,
        })),
    {
        loading: () => (
            <div className="border aspect-square w-full">
                <ChartSkeleton />
            </div>
        ),
        ssr: false,
    },
);

export function PriceImprovementCardClient({ data }: PriceImprovementCardProps) {
    return <PriceImprovementCardLazy data={data} />;
}
