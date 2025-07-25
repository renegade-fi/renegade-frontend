"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
    "inline-flex items-center justify-center  text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
    {
        defaultVariants: {
            size: "default",
            variant: "default",
        },
        variants: {
            size: {
                default: "h-9 px-3",
                lg: "h-10 px-3",
                sm: "h-8 px-2",
            },
            variant: {
                default: "bg-transparent",
                outline:
                    "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
            },
        },
    },
);

const Toggle = React.forwardRef<
    React.ElementRef<typeof TogglePrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
        VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
    <TogglePrimitive.Root
        className={cn(toggleVariants({ className, size, variant }))}
        ref={ref}
        {...props}
    />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
