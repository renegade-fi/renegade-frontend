import React, { useMemo, useRef } from "react"

import NumberFlow from "@number-flow/react"

import { useTimeToFill } from "@/app/stats/hooks/use-time-to-fill"

import { NumberInput } from "@/components/number-input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TimeToFillCard() {
  const [selectedAmount, setSelectedAmount] = React.useState<number>(10000)
  const [isCustom, setIsCustom] = React.useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const timeToFillMs = useTimeToFill({
    amount: selectedAmount,
  })

  // Convert ms to minutes for display
  const timeInMinutes = useMemo(() => {
    return timeToFillMs / (1000 * 60)
  }, [timeToFillMs])

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      setSelectedAmount(value)
    }
  }

  const handleCustomClick = () => {
    setIsCustom(true)
    setSelectedAmount(0)
    // Focus the input on next tick after render
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="font-serif text-4xl font-bold tracking-tighter lg:tracking-normal">
            {selectedAmount === 0 ? (
              "Select an amount"
            ) : timeToFillMs !== undefined ? (
              <NumberFlow
                format={{
                  maximumFractionDigits: 0,
                  minimumFractionDigits: 0,
                }}
                suffix={timeInMinutes === 1 ? " minute" : " minutes"}
                value={timeInMinutes}
              />
            ) : (
              <Skeleton className="h-10 w-40" />
            )}
          </CardTitle>
          <CardDescription>
            Estimated Time to Fill{" "}
            <NumberFlow
              format={{
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              }}
              value={selectedAmount}
            />
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-4">
          <Button
            onClick={() => {
              setSelectedAmount(10000)
              setIsCustom(false)
            }}
          >
            $10k
          </Button>
          <Button
            onClick={() => {
              setSelectedAmount(100000)
              setIsCustom(false)
            }}
          >
            $100k
          </Button>
          {isCustom ? (
            <NumberInput
              ref={inputRef}
              className="rounded-lg border p-2 text-center"
              placeholder="Enter amount"
              value={selectedAmount || ""}
              onChange={handleCustomChange}
            />
          ) : (
            <Button onClick={handleCustomClick}>Custom</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
