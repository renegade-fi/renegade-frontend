import { Table, TableBody, TableCell, TableFooter, TableRow } from "@/components/ui/table";
import type { TwapSummaryCardData } from "../actions/get-summary-card-data";
import { calculateDuration, formatLocalDateTime } from "../lib/date-utils";

interface TwapSummaryProps {
    data: TwapSummaryCardData;
}

export function TwapSummaryCard({ data }: TwapSummaryProps) {
    const { summary, numTrades, startTime, endTime } = data;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const { hours, minutes } = calculateDuration(start, end);

    const localStartDisplay = formatLocalDateTime(start);

    return (
        <div className="flex-1 flex flex-col gap-4">
            <div className="flex gap-4">
                <div className="flex-1 space-y-4">
                    <h3 className="font-serif text-xl font-bold tracking-tighter lg:tracking-normal">
                        TWAP Details
                    </h3>
                    <div className="border ">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Time</TableCell>
                                    <TableCell className="text-right">
                                        {localStartDisplay}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Total Size
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {summary.totalSize.toFixed(4)} USDC
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Executed Size
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {summary.executedSize.toFixed(4)} USDC
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Total Runtime
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="tabular-nums">{hours}</span>h{" "}
                                        <span className="tabular-nums">{minutes}</span>m
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Number of clips
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {numTrades} clips
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Renegade fee
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="tabular-nums">
                                            {summary.renegadeFeeBps.toFixed(1)}
                                        </span>{" "}
                                        bps
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    <h3 className="font-serif text-xl font-bold tracking-tighter lg:tracking-normal">
                        Price Analysis
                    </h3>
                    <div className="border ">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Average Price (Binance only)
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {summary.averagePriceBinance.toFixed(4)}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Average Price (with Renegade)
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {summary.averagePriceRenegade.toFixed(4)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell>Price improvement</TableCell>
                                    <TableCell className="text-green-price text-right">
                                        <span className="tabular-nums">
                                            {summary.cumulativeDeltaBps.toFixed(2)}
                                        </span>{" "}
                                        bps
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
