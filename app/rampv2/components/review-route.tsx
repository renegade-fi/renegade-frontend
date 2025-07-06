import type { LiFiStep, Route } from "@lifi/sdk";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import { formatUnits } from "viem/utils";
import { useAccount, useBalance } from "wagmi";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber, truncateAddress } from "@/lib/format";
import { resolveTicker } from "@/lib/token";
import { getChainLogoTicker, getFormattedChainName } from "@/lib/viem";
import type { Intent } from "../core/intent";
import { isBridge, isETH, isSwap } from "../helpers";

interface Props {
    intent: Intent;
    route?: Route;
    status: "pending" | "success" | "error";
}

export function ReviewRoute({ intent, route, status }: Props) {
    // Identify bridge and swap legs (at most one each for our planner output)
    if (route) {
        const bridgeStep = isBridge(route);
        const swapStep = isSwap(route);

        if (bridgeStep) {
            return (
                <Layout animationKey="bridge">
                    <BridgeSection step={bridgeStep} />
                </Layout>
            );
        }
        if (swapStep) {
            return (
                <Layout animationKey="swap">
                    <SwapSection step={swapStep} />
                </Layout>
            );
        }
    }

    if (status === "error") {
        return (
            <Layout animationKey="error">
                <div className="text-center text-sm text-muted-foreground">
                    {intent.needsBridge() ? "Bridge" : intent.needsWrap() ? "Wrap" : "Swap"}
                    is currently unavailable, please try again later.
                </div>
            </Layout>
        );
    }

    return (
        <Layout animationKey="loading">
            <div className="text-center text-sm text-muted-foreground">
                Fetching {intent.needsBridge() ? "bridge" : intent.needsWrap() ? "wrap" : "swap"}{" "}
                info for review...
            </div>
        </Layout>
    );
}

export function Row({
    label,
    value,
    imageUri,
    url,
}: {
    label: string;
    value: string | React.ReactNode;
    imageUri?: string;
    url?: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <div className="flex items-center gap-1">
                {imageUri && (
                    <Image
                        alt=""
                        className="flex-shrink-0 rounded-full object-cover"
                        height={16}
                        src={imageUri}
                        width={16}
                    />
                )}
                {typeof value === "string" ? <span>{value}</span> : value}
                {url && <ExternalLinkIcon className="h-4 w-4" />}
            </div>
        </div>
    );
}

// Simple fade animation wrapper
function Layout({ children, animationKey }: { children: React.ReactNode; animationKey: string }) {
    return (
        <motion.div
            key={animationKey}
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
            {children}
        </motion.div>
    );
}

/* ---------------------------------------------------------------------- */
/* Sections                                                               */
/* ---------------------------------------------------------------------- */

function BridgeSection({ step }: { step: LiFiStep }) {
    const {
        action: {
            fromChainId,
            toChainId,
            fromAddress,
            toAddress,
            fromAmount,
            fromToken: { decimals: fromDecimals, symbol: fromSymbol, logoURI: fromLogoURI },
            toToken: { decimals: toDecimals, symbol: toSymbol, logoURI: toLogoURI },
        },
        estimate: { executionDuration, gasCosts, toAmount },
        toolDetails: { name: toolName, logoURI: toolLogoURI },
    } = step;

    const feeEstimate = parseFloat(gasCosts?.[0]?.amountUSD ?? "0");
    const feeDisplay = feeEstimate === 0 ? "Free" : `~$${feeEstimate.toFixed(2)}`;
    const durationDisplay = executionDuration === 0 ? "Instant" : `~${executionDuration} seconds`;

    const fromAmountFormatted = formatUnits(BigInt(fromAmount), fromDecimals);
    const toAmountFormatted = formatUnits(BigInt(toAmount), toDecimals);

    const fromChainTicker = getChainLogoTicker(fromChainId);
    const fromChainLogo =
        fromChainTicker === "SOL" ? "/tokens/sol.png" : resolveTicker(fromChainTicker).logoUrl;

    const toChainTicker = getChainLogoTicker(toChainId);
    const toChainLogo =
        toChainTicker === "SOL" ? "/tokens/sol.png" : resolveTicker(toChainTicker).logoUrl;

    return (
        <AccordionPrimitive.Root collapsible className="border p-3 text-sm" type="single">
            <AccordionPrimitive.Item value="item-1">
                <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger className="flex w-full justify-between [&[data-state=open]>div>.accordion-label]:mt-0 [&[data-state=open]>div>.accordion-label]:h-2 [&[data-state=open]>div>.accordion-label]:opacity-0 [&[data-state=open]>svg]:rotate-180">
                        <div className="space-y-3 text-left">
                            <div className="flex items-center gap-2">
                                <InfoCircledIcon className="h-4 w-4" />
                                <span>{`Review bridge from ${getFormattedChainName(fromChainId)} to ${getFormattedChainName(toChainId)}`}</span>
                            </div>
                            <div className="accordion-label text-muted-foreground transition-all">
                                {`Bridge ${fromAmountFormatted} ${fromSymbol} using ${toolName}`}
                            </div>
                        </div>
                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                    </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="flex flex-col gap-2">
                        <Row
                            imageUri={fromLogoURI}
                            label={`Bridge ${fromSymbol}`}
                            value={fromAmountFormatted}
                        />
                        <Row
                            imageUri={toLogoURI}
                            label={`Receive ${toSymbol}`}
                            value={toAmountFormatted}
                        />
                        {fromAddress && toAddress && fromAddress !== toAddress && (
                            <>
                                <Row
                                    label="From Address"
                                    value={
                                        <Tooltip>
                                            <TooltipTrigger type="button">
                                                {truncateAddress(fromAddress)}
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                {fromAddress}
                                            </TooltipContent>
                                        </Tooltip>
                                    }
                                />
                                <Row
                                    label="To Address"
                                    value={
                                        <Tooltip>
                                            <TooltipTrigger type="button">
                                                {truncateAddress(toAddress)}
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                {toAddress}
                                            </TooltipContent>
                                        </Tooltip>
                                    }
                                />
                            </>
                        )}
                        <Row
                            imageUri={fromChainLogo}
                            label="From"
                            value={getFormattedChainName(fromChainId)}
                        />
                        <Row
                            imageUri={toChainLogo}
                            label="To"
                            value={getFormattedChainName(toChainId)}
                        />
                        <Row imageUri={toolLogoURI} label="Using" value={toolName} />
                        <Row label="Duration" value={durationDisplay} />
                        <Row label="Estimated Fees" value={feeDisplay} />
                    </div>
                </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
        </AccordionPrimitive.Root>
    );
}

function SwapSection({ step }: { step: LiFiStep }) {
    const {
        action: {
            fromAmount,
            fromToken: {
                decimals: fromDecimals,
                symbol: fromSymbol,
                logoURI: fromLogoURI,
                address: fromAddress,
            },
            toToken: {
                decimals: toDecimals,
                symbol: toSymbol,
                logoURI: toLogoURI,
                address: toAddress,
            },
            fromChainId,
        },
        estimate: { executionDuration, gasCosts, toAmount },
        toolDetails: { name: toolName, logoURI: toolLogoURI },
    } = step;

    const feeEstimate = parseFloat(gasCosts?.[0]?.amountUSD ?? "0");
    const feeDisplay = feeEstimate === 0 ? "Free" : `~$${feeEstimate.toFixed(2)}`;
    const durationDisplay = executionDuration === 0 ? "Instant" : `~${executionDuration} seconds`;

    const fromAmountFormatted = formatUnits(BigInt(fromAmount), fromDecimals);
    const toAmountFormatted = formatUnits(BigInt(toAmount), toDecimals);

    const isWrap = isETH(fromAddress, fromChainId);

    // Fetch current ETH balance if wrap to compute remaining
    const { address } = useAccount();
    const { data: ethBalance } = useBalance({
        address,
        chainId: fromChainId,
        query: {
            enabled: isWrap,
        },
    });
    const remainingEthBalance = isWrap
        ? (ethBalance?.value ?? BigInt(0)) - BigInt(fromAmount)
        : BigInt(0);

    const ethLogoUri = "/mainnet.svg";
    const wethLogoUri = resolveTicker("WETH").logoUrl;

    return (
        <AccordionPrimitive.Root collapsible className="border p-3 text-sm" type="single">
            <AccordionPrimitive.Item value="item-1">
                <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger className="flex w-full justify-between [&[data-state=open]>div>.accordion-label]:mt-0 [&[data-state=open]>div>.accordion-label]:h-2 [&[data-state=open]>div>.accordion-label]:opacity-0 [&[data-state=open]>svg]:rotate-180">
                        <div className="space-y-3 text-left">
                            <div className="flex items-center gap-2">
                                <InfoCircledIcon className="h-4 w-4" />
                                {isWrap ? (
                                    <span>Review wrap of ETH</span>
                                ) : (
                                    <span>{`Review swap from ${fromSymbol} to ${toSymbol}`}</span>
                                )}
                            </div>
                            <div className="accordion-label text-muted-foreground transition-all">
                                {isWrap
                                    ? `Wrap ${fromAmountFormatted} ETH`
                                    : `Swap ${fromAmountFormatted} ${fromSymbol} using ${toolName}`}
                            </div>
                        </div>
                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                    </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="flex flex-col gap-2">
                        <Row
                            imageUri={isWrap ? ethLogoUri : fromLogoURI}
                            label={isWrap ? `Wrap ETH` : `Swap ${fromSymbol}`}
                            value={fromAmountFormatted}
                        />
                        <Row
                            imageUri={isWrap ? wethLogoUri : toLogoURI}
                            label={`Receive ${toSymbol}`}
                            value={toAmountFormatted}
                        />
                        {isWrap ? null : (
                            <Row imageUri={toolLogoURI} label="Using" value={toolName} />
                        )}
                        <Row label="Duration" value={durationDisplay} />
                        <Row label="Estimated Fees" value={feeDisplay} />
                        {isWrap ? (
                            <Row
                                imageUri={ethLogoUri}
                                label="ETH Remaining"
                                value={formatNumber(remainingEthBalance, 18, true)}
                            />
                        ) : null}
                    </div>
                </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
        </AccordionPrimitive.Root>
    );
}
