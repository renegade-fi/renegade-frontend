import React from "react"

import { Input, InputProps } from "@/components/ui/input"

import { cn } from "@/lib/utils"

const NumberInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const handleBeforeInput = (event: React.FormEvent<HTMLInputElement>) => {
      const inputEvent = event.nativeEvent as InputEvent
      if (inputEvent.data && !/^\d*\.?\d*$/.test(inputEvent.data)) {
        event.preventDefault()
      }
    }
    return (
      <Input
        className={cn(
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          className,
        )}
        onWheel={(e) => (e.target as HTMLElement).blur()}
        onBeforeInput={handleBeforeInput}
        ref={ref}
        type="number"
        {...props}
      />
    )
  },
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
