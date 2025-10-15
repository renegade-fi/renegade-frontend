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
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="text-right">{amount}</div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {amount} {sendTicker}
                        </TooltipContent>
                    </Tooltip>
                );
            },
            header: () => <div className="text-right">{sendTicker} sold</div>,
        },
        {
            accessorKey: "receiveAmountBinance",
            cell: ({ row }) => {
                const amount = row.getValue<string>("receiveAmountBinance");
                return (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="text-right">{amount}</div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {amount} {receiveTicker}
                        </TooltipContent>
                    </Tooltip>
                );
            },
            header: () => <div className="text-right">{receiveTicker} bought (Binance only)</div>,
        },
        {
            accessorKey: "receiveAmountRenegade",
            cell: ({ row }) => {
                const amount = row.getValue<string>("receiveAmountRenegade");
                return (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="text-right">{amount}</div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {amount} {receiveTicker}
                        </TooltipContent>
                    </Tooltip>
                );
            },
            header: () => (
                <div className="text-right">{receiveTicker} bought (Binance with Renegade)</div>
            ),
        },
        {
            accessorKey: "deltaBps",
            cell: ({ row }) => {
                const deltaBps = row.getValue<string>("deltaBps");
                return <div className="text-right font-mono">{deltaBps}</div>;
            },
            header: () => <div className="text-right">Price improvement (bps)</div>,
        },
    ];
}
