"use client";

import dynamic from "next/dynamic";
import type { TwapPriceTableData } from "../actions/get-price-table-data";

const TwapPriceTableLazy = dynamic(
    () =>
        import("./twap-price-table").then((mod) => ({
            default: mod.TwapPriceTable,
        })),
    {
        loading: () => (
            <div className="p-6 text-sm text-muted-foreground">Loading price comparison...</div>
        ),
        ssr: false,
    },
);

export function TwapPriceTableWrapper({ data }: { data: TwapPriceTableData }) {
    return <TwapPriceTableLazy data={data} />;
}
