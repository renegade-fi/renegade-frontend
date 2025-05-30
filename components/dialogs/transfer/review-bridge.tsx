import React from "react"

import { LiFiStep } from "@lifi/sdk"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon, InfoCircledIcon } from "@radix-ui/react-icons"
import { Token } from "@renegade-fi/token-nextjs"
import { motion } from "framer-motion"
import { formatUnits } from "viem/utils"

import { Row } from "@/components/dialogs/transfer/row"
import { allowBridges } from "@/components/dialogs/transfer/use-bridge-quote"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { truncateAddress } from "@/lib/format"
import { getChainLogoTicker, getFormattedChainName } from "@/lib/viem"

function Layout({
  children,
  animationKey,
}: {
  children: React.ReactNode
  animationKey: string
}) {
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
  )
}

export function ReviewBridge({
  quote,
  error,
}: {
  quote?: LiFiStep
  error: Error | null
}) {
  if (quote) {
    return (
      <Layout animationKey="quote">
        <ReviewBridgeContent quote={quote} />
      </Layout>
    )
  }
  if (error) {
    return (
      <Layout animationKey="error">
        <div className="text-center text-sm text-muted-foreground">
          Bridging is currently unavailable, please try again later.
        </div>
      </Layout>
    )
  }
  return (
    <Layout animationKey="loading">
      <div className="text-center text-sm text-muted-foreground">
        Fetching bridge info for review...
      </div>
    </Layout>
  )
}

function ReviewBridgeContent({ quote }: { quote: LiFiStep }) {
  const [value, setValue] = React.useState("")
  const {
    action: {
      fromChainId,
      toChainId,
      fromAddress,
      toAddress,
      fromAmount,
      fromToken: {
        decimals: fromDecimals,
        symbol: fromSymbol,
        logoURI: fromLogoURI,
      },
      toToken: { decimals: toDecimals, symbol: toSymbol, logoURI: toLogoURI },
    },
    estimate: { executionDuration, gasCosts, toAmount },
    toolDetails: { key: toolKey, name: toolName, logoURI: toolLogoURI },
  } = quote

  // Only support Across for now
  if (!allowBridges.includes(toolKey)) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        {`${toolKey} is not supported.`}
      </div>
    )
  }
  const feeEstimate =
    // parseFloat(feeCosts?.[0]?.amountUSD ?? "0") + // Likely accounted for in estimate calculation
    parseFloat(gasCosts?.[0]?.amountUSD ?? "0")
  const fromAmountFormatted = formatUnits(BigInt(fromAmount), fromDecimals)
  const toAmountFormatted = formatUnits(BigInt(toAmount), toDecimals)

  const fromChainTicker = getChainLogoTicker(fromChainId)
  const fromChainLogo =
    fromChainTicker === "SOL"
      ? "/tokens/sol.png"
      : Token.findByTicker(fromChainTicker).logoUrl

  const toChainTicker = getChainLogoTicker(toChainId)
  const toChainLogo =
    toChainTicker === "SOL"
      ? "/tokens/sol.png"
      : Token.findByTicker(toChainTicker).logoUrl

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
                <span>{`Review bridge from ${getFormattedChainName(fromChainId)} to ${getFormattedChainName(toChainId)}`}</span>
              </div>
              <div className="accordion-label text-muted-foreground transition-all">{`Bridge ${fromAmountFormatted} ${fromSymbol} using ${toolName}`}</div>
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
                      <TooltipContent side="right">{toAddress}</TooltipContent>
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
            <Row
              imageUri={toolLogoURI}
              label="Using"
              value={toolName}
            />
            <Row
              label="Duration"
              value={`~${executionDuration} seconds`}
            />
            <Row
              label="Fee Estimate"
              value={`~$${feeEstimate.toFixed(2)}`}
            />
          </div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  )
}
