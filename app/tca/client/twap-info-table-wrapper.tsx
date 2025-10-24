"use client";

import dynamic from "next/dynamic";
import type { TwapInfoTableData } from "../actions/get-info-table-data";

const TwapInfoTableLazy = dynamic(
    () =>
        import("./twap-info-table").then((mod) => ({
            default: mod.TwapInfoTable,
        })),
    {
        loading: () => (
            <div className="p-6 text-sm text-muted-foreground">Loading execution details...</div>
        ),
        ssr: false,
    },
);

export function TwapInfoTableWrapper({ data }: { data: TwapInfoTableData }) {
    return <TwapInfoTableLazy data={data} />;
}
