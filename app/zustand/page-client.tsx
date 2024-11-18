"use client"

import { Button } from "@/components/ui/button"

import { Side } from "@/lib/constants/protocol"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

export const PageClient = () => {
  const { order, setSide, setAmount } = useServerStore((state) => state)

  return (
    <div>
      Order: {JSON.stringify(order)}
      <hr />
      <Button
        type="button"
        onClick={() =>
          void setSide(order.side === Side.BUY ? Side.SELL : Side.BUY)
        }
      >
        Toggle Side
      </Button>
      <Button
        type="button"
        onClick={() => void setAmount(Math.random().toString())}
      >
        Random Amount
      </Button>
    </div>
  )
}
