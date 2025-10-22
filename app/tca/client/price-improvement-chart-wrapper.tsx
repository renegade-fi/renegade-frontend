"use client";

import dynamic from "next/dynamic";
import type { TwapPriceTableData } from "../actions/get-price-table-data";
import { PriceImprovementChartSkeleton } from "./chart-skeleton";

const PriceImprovementChartLazy = dynamic(
    () =>
        import("./price-improvement-chart").then((mod) => ({
            default: mod.PriceImprovementChart,
        })),
    {
        loading: () => <PriceImprovementChartSkeleton />,
        ssr: false,
    },
);

export function PriceImprovementChartWrapper({ data }: { data: TwapPriceTableData }) {
    return <PriceImprovementChartLazy data={data} />;
}
