import React from "react";

import { Input, type InputProps } from "@/components/ui/input";

import { cn } from "@/lib/utils";

const NumberInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        const handleBeforeInput = (event: React.FormEvent<HTMLInputElement>) => {
            const inputEvent = event.nativeEvent as InputEvent;
            if (inputEvent.data && !/^\d*\.?\d*$/.test(inputEvent.data)) {
                event.preventDefault();
            }
        };
        return (
            <Input
                className={cn(
                    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                    className,
                )}
                inputMode="decimal"
                onBeforeInput={handleBeforeInput}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                ref={ref}
                step="any"
                type="number"
                {...props}
            />
        );
    },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
