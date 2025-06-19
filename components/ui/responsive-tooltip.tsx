"use client";

import type * as PopoverPrimitive from "@radix-ui/react-popover";
import type * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type React from "react";
import { createContext, useContext } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type PopoverContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;
type TooltipContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;

type ResponsiveTooltipProps = TooltipPrimitive.TooltipProps &
    PopoverPrimitive.PopoverProps & {
        children: React.ReactNode;
    };

type ResponsiveTooltipTriggerProps = React.ComponentPropsWithoutRef<typeof TooltipTrigger> &
    React.ComponentPropsWithoutRef<typeof PopoverTrigger> & {
        children: React.ReactNode;
    };

type ResponsiveTooltipContentProps = TooltipContentProps &
    PopoverContentProps & {
        children: React.ReactNode;
    };

type ResponsiveTooltipContextType = {
    isMobile: boolean;
};

const ResponsiveTooltipContext = createContext<ResponsiveTooltipContextType | null>(null);

function useResponsiveTooltipContext() {
    const context = useContext(ResponsiveTooltipContext);
    if (!context) {
        throw new Error("ResponsiveTooltip components must be used within ResponsiveTooltip");
    }
    return context;
}

export function ResponsiveTooltipTrigger({ children, ...props }: ResponsiveTooltipTriggerProps) {
    const { isMobile } = useResponsiveTooltipContext();

    if (isMobile) {
        return (
            <PopoverTrigger type="button" {...props}>
                {children}
            </PopoverTrigger>
        );
    }

    return (
        <TooltipTrigger type="button" {...props}>
            {children}
        </TooltipTrigger>
    );
}

export function ResponsiveTooltipContent({
    children,
    side,
    className,
    ...props
}: ResponsiveTooltipContentProps) {
    const { isMobile } = useResponsiveTooltipContext();

    if (isMobile) {
        return (
            <PopoverContent
                className={cn(
                    "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    "max-w-[90vw]",
                    className,
                )}
                side={side}
                useTriggerWidth={false}
                {...props}
            >
                {children}
            </PopoverContent>
        );
    }

    return (
        <TooltipContent className={className} side={side} {...props}>
            {children}
        </TooltipContent>
    );
}

export function ResponsiveTooltip({ children, ...props }: ResponsiveTooltipProps) {
    const isMobile = useIsMobile();

    return (
        <ResponsiveTooltipContext.Provider value={{ isMobile }}>
            {isMobile ? (
                <Popover {...props}>{children}</Popover>
            ) : (
                <Tooltip {...props}>{children}</Tooltip>
            )}
        </ResponsiveTooltipContext.Provider>
    );
}
