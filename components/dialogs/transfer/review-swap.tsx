import type { LiFiStep } from "@lifi/sdk";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import React from "react";
import { formatUnits } from "viem/utils";

import { Row } from "@/components/dialogs/transfer/row";

function Layout({ children, animationKey }: { children: React.ReactNode; animationKey: string }) {
    return (
        <motion.div
            key={animationKey}
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
            }}
        >
            {children}
        </motion.div>
    );
}

export function ReviewSwap({ quote, error }: { quote?: LiFiStep; error: Error | null }) {
    if (quote) {
        return (
            <Layout animationKey="quote">
                <ReviewBridgeContent quote={quote} />
            </Layout>
        );
    }
    if (error) {
        return (
            <Layout animationKey="error">
                <div className="text-center text-sm text-muted-foreground">
                    Swapping is currently unavailable, please try again later.
                </div>
            </Layout>
        );
    }
    return (
        <Layout animationKey="loading">
            <div className="text-center text-sm text-muted-foreground">
                Fetching swap info for review...
            </div>
        </Layout>
    );
}

function ReviewBridgeContent({ quote }: { quote: LiFiStep }) {
    const [value, setValue] = React.useState("");
    const {
        action: {
            fromAmount,
            fromToken: { decimals: fromDecimals, symbol: fromSymbol, logoURI: fromLogoURI },
            toToken: { decimals: toDecimals, symbol: toSymbol, logoURI: toLogoURI },
        },
        estimate: { executionDuration, gasCosts, toAmount },
        toolDetails: { name: toolName, logoURI: toolLogoURI },
    } = quote;

    const feeEstimate =
        // parseFloat(feeCosts?.[0]?.amountUSD ?? "0") + // Likely accounted for in estimate calculation
        parseFloat(gasCosts?.[0]?.amountUSD ?? "0");
    const fromAmountFormatted = formatUnits(BigInt(fromAmount), fromDecimals);
    const toAmountFormatted = formatUnits(BigInt(toAmount), toDecimals);

    return (
        <AccordionPrimitive.Root
            collapsible
            className="border p-3 text-sm"
            type="single"
            value={value}
            onValueChange={setValue}
        >
            <AccordionPrimitive.Item value="item-1">
                <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger className="flex w-full justify-between [&[data-state=open]>div>.accordion-label]:mt-0 [&[data-state=open]>div>.accordion-label]:h-2 [&[data-state=open]>div>.accordion-label]:opacity-0 [&[data-state=open]>svg]:rotate-180">
                        <div className="space-y-3 text-left">
                            <div className="flex items-center gap-2">
                                <InfoCircledIcon className="h-4 w-4" />
                                <span>{`Review swap from ${fromSymbol} to ${toSymbol}`}</span>
                            </div>
                            <div className="accordion-label text-muted-foreground transition-all">{`Swap ${fromAmountFormatted} ${fromSymbol} using ${toolName}`}</div>
                        </div>
                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                    </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="flex flex-col gap-2">
                        <Row
                            imageUri={fromLogoURI}
                            label={`Swap ${fromSymbol}`}
                            value={fromAmountFormatted}
                        />
                        <Row
                            imageUri={toLogoURI}
                            label={`Receive ${toSymbol}`}
                            value={toAmountFormatted}
                        />
                        <Row imageUri={toolLogoURI} label="Using" value={toolName} />
                        <Row label="Duration" value={`~${executionDuration} seconds`} />
                        <Row label="Fee Estimate" value={`~$${feeEstimate.toFixed(2)}`} />
                    </div>
                </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
        </AccordionPrimitive.Root>
    );
}
