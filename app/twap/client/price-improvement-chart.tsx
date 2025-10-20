import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TwapPriceTableData } from "../actions/get-price-table-data";

interface PriceImprovementChartProps {
    data: TwapPriceTableData;
}

function getTokenAmountFormat(value: number, ticker: string) {
    const isUSDC = ticker === "USDC";

    if (isUSDC) {
        // Check if whole number
        if (Math.abs(value - Math.round(value)) < 0.01) {
            return { maximumFractionDigits: 0, minimumFractionDigits: 0 };
        }
        return { maximumFractionDigits: 2, minimumFractionDigits: 2 };
    }

    // For non-USDC: find decimals needed for first sig fig
    const absValue = Math.abs(value);
    if (absValue >= 1 || absValue === 0) {
        // Whole number or zero
        return { maximumFractionDigits: 0, minimumFractionDigits: 0 };
    }

    // Calculate decimals needed
    const decimalsNeeded = Math.ceil(-Math.log10(absValue));
    return {
        maximumFractionDigits: decimalsNeeded,
        minimumFractionDigits: decimalsNeeded,
    };
}

export function PriceImprovementChart({ data }: PriceImprovementChartProps) {
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

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Price Improvement</CardTitle>
                <CardDescription>
                    Trades routed through Renegade cross at the midpoint price, providing strictly
                    better execution than Binance.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 grid place-items-center">
                <NumberFlowGroup>
                    <div className="grid grid-cols-1 place-items-center">
                        <NumberFlow
                            className="text-4xl font-bold text-green-price"
                            format={{
                                maximumFractionDigits: 2,
                            }}
                            suffix=" bps"
                            value={displayBps}
                        />
                        <NumberFlow
                            className="text-lg font-bold"
                            format={{
                                signDisplay: "always",
                                ...getTokenAmountFormat(displayAmount, receivedTicker),
                            }}
                            prefix="("
                            suffix={` ${receivedTicker})`}
                            value={displayAmount}
                        />
                    </div>
                </NumberFlowGroup>
            </CardContent>
        </Card>
    );
}
