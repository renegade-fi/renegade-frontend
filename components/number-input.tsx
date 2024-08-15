import React from "react"

import { Input, InputProps } from "@/components/ui/input"

import { cn } from "@/lib/utils"

const NumberInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <Input
        className={cn(
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          className,
        )}
        onWheel={(e) => (e.target as HTMLElement).blur()}
        ref={ref}
        type="number"
        {...props}
      />
    )
  },
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
