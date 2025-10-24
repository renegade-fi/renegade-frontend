import numeral from "numeral";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { TwapInfoTableData } from "../actions/get-info-table-data";
import { calculateDuration, formatLocalDateTime } from "../lib/date-utils";
import { formatUSDC } from "../lib/utils";

interface TwapInfoTableProps {
    data: TwapInfoTableData;
}

export function TwapInfoTable({ data }: TwapInfoTableProps) {
    const { numTrades, startTime, endTime, asset, direction } = data;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const { hours, minutes } = calculateDuration(start, end);

    const localStartDisplay = formatLocalDateTime(start);

    return (
        <Table>
            <TableBody>
                <TableRow>
                    <TableCell className="text-muted-foreground">Asset</TableCell>
                    <TableCell className="text-right">{asset}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-muted-foreground">Direction</TableCell>
                    <TableCell className="text-right">{direction}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-muted-foreground">Total Size</TableCell>
                    <TableCell className="text-right">{formatUSDC(data.totalSize)} USDC</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-muted-foreground">Start Time</TableCell>
                    <TableCell className="text-right">{localStartDisplay}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-muted-foreground">Total Runtime</TableCell>
                    <TableCell className="text-right">
                        <span className="tabular-nums">{hours}</span>h{" "}
                        <span className="tabular-nums">{minutes}</span>m
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-muted-foreground">Number of Clips</TableCell>
                    <TableCell className="text-right tabular-nums">
                        {numeral(numTrades).format("0,0")} clips
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-muted-foreground">Renegade Fee</TableCell>
                    <TableCell className="text-right">
                        <span className="tabular-nums">
                            {numeral(data.renegadeFeeBps).format("0,0")}
                        </span>{" "}
                        bps
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}
