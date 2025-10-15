import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface TwapSummaryCardsProps {
    summary: {
        cumulativeDeltaBps: number;
        renegadeFeeBps: number;
        binanceFeeBps: number;
        cumulativeSold: number;
        soldTicker: string;
        cumulativeRenegadeReceived: number;
        cumulativeBinanceReceived: number;
        receivedTicker: string;
    } | null;
}

export function TwapSummaryCards({ summary }: TwapSummaryCardsProps) {
    if (!summary) {
        return null;
    }

    return (
        <div className="grid grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardDescription>Price Improvement</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                        {summary.cumulativeDeltaBps.toFixed(2)} bps
                    </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground w-full flex justify-between">
                        <span>Renegade Fee</span>
                        <span className="tabular-nums">
                            {`${summary.renegadeFeeBps.toFixed(1)} bps`}
                        </span>
                    </div>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardDescription>Order Summary</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums slashed-zero">
                        {`Total ${summary.soldTicker} Sold: `} {summary.cumulativeSold.toFixed(4)}
                    </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground w-full flex justify-between">
                        <span>
                            {`Total ${summary.receivedTicker} bought (Binance with Renegade)`}{" "}
                        </span>
                        <span className="tabular-nums">
                            {`${summary.cumulativeRenegadeReceived.toFixed(4)}`}
                        </span>
                    </div>
                    <div className="text-muted-foreground w-full flex justify-between">
                        <span>{`Total ${summary.receivedTicker} bought (Binance only)`} </span>
                        <span className="tabular-nums">
                            {`${summary.cumulativeBinanceReceived.toFixed(4)}`}
                        </span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
