import type { ColumnDef } from "@tanstack/react-table";
import { formatLocalDateTime } from "@/app/twap/lib/date-utils";
import type { TwapTableRow } from "@/app/twap/lib/table-types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function buildColumns({
    sendTicker,
    receiveTicker,
}: {
    sendTicker: string;
    receiveTicker: string;
}): ColumnDef<TwapTableRow>[] {
    return [
        {
            accessorKey: "time",
            cell: ({ row }) => {
                const time = row.getValue<string>("time");
                const d = new Date(time);
                if (Number.isNaN(d.getTime())) return time;
                const formatted = formatLocalDateTime(d);

                let diffLabel = `${row.original.timeSinceStart} since start`;
                if (row.original.timeSincePrevious) {
                    diffLabel += ` | ${row.original.timeSincePrevious} since previous clip`;
                }

                return (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="font-medium">{formatted}</div>
                        </TooltipTrigger>
                        <TooltipContent side="right">{diffLabel}</TooltipContent>
                    </Tooltip>
                );
            },
            header: () => <div>Time</div>,
        },
        {
            accessorKey: "sendAmount",
            cell: ({ row }) => {
                const amount = row.getValue<string>("sendAmount");
                return (
                    <div className="text-right">
                        {amount} {sendTicker}
                    </div>
                );
            },
            header: () => <div className="text-right">Trade Value</div>,
        },
        {
            columns: [
                {
                    accessorKey: "priceBinanceAndRenegade",
                    cell: ({ row }) => {
                        const price = row.getValue<string>("priceBinanceAndRenegade");
                        return <div className="text-right">{price}</div>;
                    },
                    header: () => <div className="text-right">Price</div>,
                },
                {
                    accessorKey: "receiveRenegade",
                    cell: ({ row }) => {
                        const amount = row.getValue<string>("receiveRenegade");
                        return (
                            <div className="text-right">
                                {amount} {receiveTicker}
                            </div>
                        );
                    },
                    header: () => <div className="text-right">Size</div>,
                },
            ],
            header: () => <div className="text-right">Binance-with-Renegade</div>,
            id: "binanceWithRenegade",
        },
        {
            columns: [
                {
                    accessorKey: "priceBinance",
                    cell: ({ row }) => {
                        const price = row.getValue<string>("priceBinance");
                        return <div className="text-right">{price}</div>;
                    },
                    header: () => <div className="text-right">Price</div>,
                },
                {
                    accessorKey: "receiveBinance",
                    cell: ({ row }) => {
                        const amount = row.getValue<string>("receiveBinance");
                        return (
                            <div className="text-right">
                                {amount} {receiveTicker}
                            </div>
                        );
                    },
                    header: () => <div className="text-right">Size</div>,
                },
            ],
            header: () => <div className="text-right">Binance only</div>,
            id: "binance",
        },
        {
            accessorKey: "deltaBps",
            cell: ({ row }) => {
                const deltaBps = row.getValue<string>("deltaBps");
                return <div className="text-right">{deltaBps} bps</div>;
            },
            header: () => <div className="text-right">Price improvement</div>,
        },
    ];
}
