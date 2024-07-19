import { Input, InputProps } from "@/components/ui/input"

import { cn } from "@/lib/utils"

export function NumberInput({ className, ...props }: InputProps) {
  return (
    <Input
      className={cn(
        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
      type="number"
      onWheel={e => (e.target as HTMLElement).blur()}
      {...props}
    />
  )
}
