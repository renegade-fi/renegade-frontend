import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSharedMediaQuery } from '@/hooks/use-shared-media-query';
import { cn } from '@/lib/utils';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as PopoverPrimitive from '@radix-ui/react-popover';

type PopoverContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;
type TooltipContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;

type ResponsiveTooltipProps = TooltipPrimitive.TooltipProps & PopoverPrimitive.PopoverProps & {
  children: React.ReactNode;
};

type ResponsiveTooltipTriggerProps = React.ComponentPropsWithoutRef<typeof TooltipTrigger> & 
  React.ComponentPropsWithoutRef<typeof PopoverTrigger> & {
  children: React.ReactNode;
};

type ResponsiveTooltipContentProps = TooltipContentProps & PopoverContentProps & {
  children: React.ReactNode;
};

export function ResponsiveTooltipTrigger({ children, ...props }: ResponsiveTooltipTriggerProps) {
  const isDesktop = useSharedMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return <TooltipTrigger type="button" {...props}>{children}</TooltipTrigger>;
  }

  return <PopoverTrigger type="button" {...props}>{children}</PopoverTrigger>;
}

export function ResponsiveTooltipContent({ children, side, className, ...props }: ResponsiveTooltipContentProps) {
  const isDesktop = useSharedMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return <TooltipContent className={className} side={side} {...props}>{children}</TooltipContent>;
  }

  return <PopoverContent
    className={cn(
      'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      'max-w-[90vw]',
      className
    )}
    side={side}
    useTriggerWidth={false}
    {...props}
  >
    {children}
  </PopoverContent>;
}

export function ResponsiveTooltip({ children, ...props }: ResponsiveTooltipProps) {
  const isDesktop = useSharedMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return <Tooltip {...props}>{children}</Tooltip>;
  }

  return <Popover {...props}>{children}</Popover>;
}