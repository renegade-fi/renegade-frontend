import Image from "next/image"

import { LiFiStep } from "@lifi/sdk"
import { ExternalLinkIcon, InfoCircledIcon } from "@radix-ui/react-icons"
import { mainnet } from "viem/chains"
import { extractChain, formatUnits } from "viem/utils"

import { chain } from "@/lib/viem"

export function ReviewBridge({ quote }: { quote?: LiFiStep }) {
  if (!quote) return null
  const {
    action: {
      fromChainId,
      toChainId,
      fromAmount,
      fromToken: {
        address: fromMint,
        decimals: fromDecimals,
        chainId: fromTokenChainId,
        symbol: fromSymbol,
        logoURI: fromLogoURI,
      },
      toToken: {
        address: toMint,
        decimals: toDecimals,
        chainId: toTokenChainId,
        symbol: toSymbol,
        logoURI: toLogoURI,
      },
    },
    estimate: { executionDuration, feeCosts, gasCosts, toAmount, toAmountMin },
    toolDetails: { key: toolKey, name: toolName, logoURI: toolLogoURI },
  } = quote
  if (toolKey !== "across") {
    return null
  }

  const fromChain = extractChain({
    chains: [chain, mainnet],
    id: fromChainId as any,
  })
  const toChain = extractChain({
    chains: [chain, mainnet],
    id: toChainId as any,
  })
  const feeEstimate =
    parseFloat(feeCosts?.[0]?.amountUSD ?? "0") +
    parseFloat(gasCosts?.[0]?.amountUSD ?? "0")

  return (
    <div className="flex flex-col gap-2 border p-3 text-sm">
      <div className="flex items-center gap-2">
        <InfoCircledIcon className="h-4 w-4" />
        <span>{`Review bridge from ${fromChain.name} to ${toChain.name}`}</span>
      </div>
      <Row
        imageUri={fromLogoURI}
        label={`Bridge ${fromSymbol}`}
        value={`${formatUnits(BigInt(fromAmount), fromDecimals)}`}
      />
      <Row
        imageUri={toLogoURI}
        label={`Receive ${toSymbol}`}
        value={`${formatUnits(BigInt(toAmount), toDecimals)}`}
      />
      <Row
        imageUri={"/tokens/weth.png"}
        label="From"
        value={fromChain.name}
      />
      <Row
        imageUri={"/tokens/arb.png"}
        label="To"
        value={toChain.name}
      />
      <Row
        imageUri={toolLogoURI}
        label="Using"
        value={toolName}
      />
      <Row
        label="Duration"
        value={`${executionDuration} seconds`}
      />
      <Row
        label="Fee Estimate"
        value={`$${feeEstimate.toFixed(2)}`}
      />
    </div>
  )
}

function Row({
  label,
  value,
  imageUri,
  url,
}: {
  label: string
  value: string
  imageUri?: string
  url?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {imageUri && (
          <Image
            alt=""
            className="flex-shrink-0"
            height={16}
            src={imageUri}
            width={16}
          />
        )}
        <span>{value}</span>
        {url && <ExternalLinkIcon className="h-4 w-4" />}
      </div>
    </div>
  )
}
