"use client";

import dynamic from "next/dynamic";
import type { TwapInfoTableData } from "../actions/get-info-table-data";
import { RenegadeFillChartSkeleton } from "./chart-skeleton";

const RenegadeFillChartLazy = dynamic(
    () =>
        import("./renegade-fill-chart").then((mod) => ({
            default: mod.RenegadeFillChart,
        })),
    {
        loading: () => <RenegadeFillChartSkeleton />,
        ssr: false,
    },
);

export function RenegadeFillChartWrapper({ data }: { data: TwapInfoTableData }) {
    return <RenegadeFillChartLazy data={data} />;
}
