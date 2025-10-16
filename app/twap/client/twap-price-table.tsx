import numeral from "numeral";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { TwapPriceTableData } from "../actions/get-price-table-data";
import { formatUSDC } from "../lib/utils";

interface TwapPriceTableProps {
    data: TwapPriceTableData;
}

function formatReceiveAmount(amount: number, ticker: string): string {
    if (ticker === "USDC") {
        return formatUSDC(amount);
    }
    return `${numeral(amount).format("0,0[.]0000")} ${ticker}`;
}

export function TwapPriceTable({ data }: TwapPriceTableProps) {
    return (
        <div className="border flex-1 self-start">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead />
                        <TableHead className="text-right">Binance</TableHead>
                        <TableHead className="text-right">Binance-with-Renegade</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="text-muted-foreground">Average Price</TableCell>
                        <TableCell className="text-right tabular-nums">
                            {formatUSDC(data.averagePriceBinance)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                            {formatUSDC(data.averagePriceRenegade)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="text-muted-foreground">Total Received</TableCell>
                        <TableCell className="text-right tabular-nums">
                            {formatReceiveAmount(
                                data.cumulativeBinanceReceived,
                                data.receivedTicker,
                            )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                            {formatReceiveAmount(
                                data.cumulativeRenegadeReceived,
                                data.receivedTicker,
                            )}
                        </TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell>Price improvement</TableCell>
                        <TableCell className="text-green-price text-right" colSpan={2}>
                            <span className="tabular-nums">
                                {data.cumulativeDeltaBps.toFixed(2)}
                            </span>{" "}
                            bps
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}
