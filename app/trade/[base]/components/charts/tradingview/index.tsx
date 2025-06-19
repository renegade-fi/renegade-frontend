import {
    type ChartingLibraryWidgetOptions,
    type LanguageCode,
    type ResolutionString,
    widget,
} from "@renegade-fi/tradingview-charts";

import Image from "next/image";
import React from "react";

import { config } from "@/app/trade/[base]/components/charts/tradingview/config";

import { cn } from "@/lib/utils";

import { datafeed } from "./datafeed";

export default function TradingViewChart(props: Partial<ChartingLibraryWidgetOptions>) {
    const [isReady, setIsReady] = React.useState(false);
    const chartContainerRef = React.useRef<HTMLDivElement>(
        undefined,
    ) as React.MutableRefObject<HTMLInputElement>;

    React.useEffect(() => {
        const widgetOptions: ChartingLibraryWidgetOptions = {
            container: chartContainerRef.current,
            datafeed,
            interval: props.interval as ResolutionString,
            locale: props.locale as LanguageCode,
            symbol: props.symbol,
            ...config,
        };

        const tvWidget = new widget(widgetOptions);
        if (tvWidget) {
            tvWidget.onChartReady(() => {
                setIsReady(true);
            });
        }
        return () => {
            tvWidget.remove();
        };
    }, [props]);

    return (
        <>
            <div
                ref={chartContainerRef}
                className={cn("z-10 h-[400px] transition-opacity duration-300 lg:h-[500px]", {
                    "opacity-0": !isReady,
                    "opacity-100": isReady,
                })}
            />
            <div
                className={cn(
                    "absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300",
                    {
                        "opacity-100": !isReady,
                        "opacity-0": isReady,
                    },
                )}
            >
                <Image
                    priority
                    alt="logo"
                    className="animate-pulse"
                    height="57"
                    src="/glyph_dark.svg"
                    width="46"
                />
            </div>
        </>
    );
}
