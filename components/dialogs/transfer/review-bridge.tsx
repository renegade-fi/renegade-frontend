import React from "react"

import Image from "next/image"

import { LiFiStep } from "@lifi/sdk"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons"
import { motion } from "framer-motion"
import { formatUnits } from "viem/utils"

import { allowBridges } from "@/components/dialogs/transfer/use-bridge-quote"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { formatAddress } from "@/lib/format"
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
      className="text-sm"
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
        <div className="text-center text-muted-foreground">
          Bridging is currently unavailable, please try again later.
        </div>
      </Layout>
    )
  }
  return (
    <Layout animationKey="loading">
      <div className="text-center text-muted-foreground">
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
      <div className="text-center text-muted-foreground">
        {`${toolKey} is not supported.`}
      </div>
    )
  }
  const feeEstimate =
    // parseFloat(feeCosts?.[0]?.amountUSD ?? "0") + // Likely accounted for in estimate calculation
    parseFloat(gasCosts?.[0]?.amountUSD ?? "0")
  const fromAmountFormatted = formatUnits(BigInt(fromAmount), fromDecimals)
  const toAmountFormatted = formatUnits(BigInt(toAmount), toDecimals)

  return (
    <AccordionPrimitive.Root
      collapsible
      className="border p-3"
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
        <AccordionPrimitive.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
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
                      <TooltipTrigger>
                        {formatAddress(fromAddress)}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{fromAddress}</p>
                      </TooltipContent>
                    </Tooltip>
                  }
                />
                <Row
                  label="To Address"
                  value={
                    <Tooltip>
                      <TooltipTrigger>
                        {formatAddress(toAddress)}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{toAddress}</p>
                      </TooltipContent>
                    </Tooltip>
                  }
                />
              </>
            )}
            <Row
              imageUri={`/tokens/${getChainLogoTicker(fromChainId)}.png`}
              label="From"
              value={getFormattedChainName(fromChainId)}
            />
            <Row
              imageUri={`/tokens/${getChainLogoTicker(toChainId)}.png`}
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

function Row({
  label,
  value,
  imageUri,
  url,
}: {
  label: string
  value: string | React.ReactNode
  imageUri?: string
  url?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {imageUri && (
          <Image
            alt=""
            className="flex-shrink-0"
            height={16}
            src={imageUri}
            width={16}
          />
        )}
        {typeof value === "string" ? <span>{value}</span> : value}
        {url && <ExternalLinkIcon className="h-4 w-4" />}
      </div>
    </div>
  )
}
