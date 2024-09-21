import React from "react"

import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { Token } from "@renegade-fi/react"
import { ChevronDown } from "lucide-react"

import { AnimatedPrice } from "@/components/animated-price"
import { TokenSelectDialog } from "@/components/dialogs/token-select-dialog"
import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"

import { EXCHANGES, exchangeToName } from "@/lib/constants/protocol"
import { BBO_TOOLTIP } from "@/lib/constants/tooltips"
import { constructExchangeUrl } from "@/lib/utils"

export function MobileAssetPriceAccordion({ base }: { base: string }) {
  const mint = React.useMemo(() => {
    try {
      return Token.findByTicker(base).address
    } catch (error) {
      return null
    }
  }, [base])

  return (
    <AccordionPrimitive.Root
      collapsible
      className="block border-b border-border lg:hidden"
      type="single"
    >
      <AccordionPrimitive.Item value="asset-details">
        <div className="flex items-center justify-between p-4">
          <TokenSelectDialog ticker={base}>
            <Button
              className="px-2 py-0 font-serif text-2xl font-bold tracking-tighter lg:tracking-normal"
              variant="ghost"
            >
              <TokenIcon
                className="mr-2"
                size={22}
                ticker={base}
              />
              {base}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </TokenSelectDialog>
          <AccordionPrimitive.Trigger asChild>
            <Button
              className="px-2 py-0 text-xl [&[data-state=open]>svg]:rotate-180"
              variant="ghost"
            >
              <div className="mr-2 text-xs leading-none text-muted-foreground">
                BBO
              </div>
              {mint && (
                <AnimatedPrice
                  className="font-mono text-xl"
                  mint={mint}
                />
              )}
              <ChevronDown className="ml-2 h-4 w-4 transition-transform duration-200" />
            </Button>
          </AccordionPrimitive.Trigger>
        </div>
        <AccordionPrimitive.Content className="overflow-hidden p-4 pl-6 pt-0 text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="grid grid-cols-2 gap-4">
            {EXCHANGES.map((exchange) => (
              <a
                key={exchange}
                href={constructExchangeUrl(exchange, base)}
                rel="noreferrer"
                target="_blank"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-xs underline underline-offset-2">
                    {exchangeToName[exchange]}
                  </span>
                  {mint && (
                    <AnimatedPrice
                      className="font-mono"
                      exchange={exchange}
                      mint={mint}
                    />
                  )}
                </div>
              </a>
            ))}
          </div>
          <div className="mt-4 text-pretty text-xs text-muted-foreground">
            {BBO_TOOLTIP}
          </div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  )
}
