import { type OrderMetadata, OrderState } from "@renegade-fi/react";
import Image from "next/image";
import { formatUnits } from "viem/utils";

import { CancelButton } from "@/app/trade/[base]/components/order-details/cancel-button";
import { InsufficientWarning } from "@/app/trade/[base]/components/order-details/insufficient-warning";
import { OrderStatusIndicator } from "@/app/trade/[base]/components/order-details/order-status-indicator";

import { Button } from "@/components/ui/button";
import {
    ResponsiveTooltip,
    ResponsiveTooltipContent,
    ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip";
import { Separator } from "@/components/ui/separator";

import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles";
import { Side } from "@/lib/constants/protocol";
import { formatNumber, formatOrderState } from "@/lib/format";
import { resolveAddress } from "@/lib/token";

export function EmptyContent({ order }: { order: OrderMetadata }) {
    const baseToken = resolveAddress(order.data.base_mint);
    const formattedTotalAmount = formatNumber(order.data.amount, baseToken.decimals, true);
    const formattedTotalAmountLong = formatUnits(order.data.amount, baseToken.decimals);
    const title = `${order.data.side === "Buy" ? "Buy" : "Sell"} ${formattedTotalAmount} ${baseToken.ticker} ${
        order.data.side === "Buy" ? "with" : "for"
    } USDC`;
    const titleLong = `${order.data.side === "Buy" ? "Buy" : "Sell"} ${formattedTotalAmountLong} ${baseToken.ticker} ${
        order.data.side === "Buy" ? "with" : "for"
    } USDC`;

    const isCancellable = [OrderState.Created, OrderState.Matching].includes(order.state);
    const isOpen = order.state !== OrderState.Filled && order.state !== OrderState.Cancelled;

    return (
        <>
            <div className="flex flex-col gap-4 p-6 lg:flex-row">
                <OrderStatusIndicator order={order} />
                {isOpen && (
                    <InsufficientWarning
                        withDialog
                        amount={order.data.amount}
                        baseMint={order.data.base_mint}
                        className="text-sm font-bold tracking-tighter lg:tracking-normal"
                        quoteMint={order.data.quote_mint}
                        side={order.data.side === "Buy" ? Side.BUY : Side.SELL}
                    />
                )}
                <div className="hidden lg:ml-auto lg:flex">
                    <CancelButton id={order.id} isDisabled={!isCancellable} />
                </div>
            </div>
            <Separator />
            <div className="flex h-24 items-center">
                <div className="flex-1 px-6 py-4 lg:text-sm">
                    <div>{formatOrderState[order.state]}</div>
                    <ResponsiveTooltip>
                        <ResponsiveTooltipTrigger>
                            <div>{title}</div>
                        </ResponsiveTooltipTrigger>
                        <ResponsiveTooltipContent>{titleLong}</ResponsiveTooltipContent>
                    </ResponsiveTooltip>
                    <div>Midpoint Peg</div>
                </div>
            </div>
            <Separator className="lg:hidden" />
            <div className="flex p-6 lg:hidden">
                <CancelButton
                    className="border-destructive"
                    id={order.id}
                    isDisabled={!isCancellable}
                />
            </div>
            <Separator />
            <div className="grid h-[500px] place-items-center p-4">
                <div className="flex flex-col items-center gap-10 text-pretty text-center">
                    <Image
                        priority
                        alt="logo"
                        className="mx-auto animate-pulse"
                        height="57"
                        src="/glyph_dark.svg"
                        width="46"
                    />
                    <div>Once your order is filled, you&apos;ll see the details here.</div>
                    <Button asChild className="p-0 text-muted-foreground" variant="link">
                        <a
                            href={HELP_CENTER_ARTICLES.ORDER_FILLING.url}
                            rel="noreferrer"
                            target="_blank"
                        >
                            Why is it taking so long to fill my order?
                        </a>
                    </Button>
                </div>
            </div>
        </>
    );
}
