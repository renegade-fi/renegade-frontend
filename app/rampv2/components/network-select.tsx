import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { getFormattedChainName } from "@/lib/viem";

interface NetworkSelectProps {
    value: number;
    onChange: (value: number) => void;
    networks: Array<number>;
    /**
     * Networks that should appear in the list but be disabled.
     * Assumes mutual exclusion with `networks`.
     */
    disabledNetworks?: Array<number>;
}

export function NetworkSelect({
    value,
    onChange,
    networks,
    disabledNetworks = [],
}: NetworkSelectProps) {
    const [open, setOpen] = React.useState(false);
    const isDesktop = !useIsMobile();

    const networkLabels = useMemo(() => {
        const allNetworks = [...networks, ...disabledNetworks];
        return allNetworks.map((network) => {
            return { label: getFormattedChainName(network), value: network };
        });
    }, [networks, disabledNetworks]);

    return (
        <Popover modal onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                <Button
                    aria-expanded={open}
                    autoFocus
                    className={cn("justify-between px-3")}
                    role="combobox"
                    variant="outline"
                >
                    {networkLabels.find((network) => network.value === value)?.label}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0"
                onOpenAutoFocus={(e) => (!isDesktop ? e.preventDefault() : undefined)}
            >
                <Command>
                    <CommandList>
                        <CommandEmpty>No network found.</CommandEmpty>
                        <CommandGroup>
                            {networkLabels.map((network) => {
                                const isDisabled = disabledNetworks.includes(network.value);
                                return (
                                    <CommandItem
                                        disabled={isDisabled}
                                        key={network.value}
                                        onSelect={(currentValue) => {
                                            if (isDisabled) return;
                                            onChange(Number(currentValue));
                                            setOpen(false);
                                        }}
                                        value={network.value.toString()}
                                    >
                                        <span className="flex-1">
                                            {isDisabled
                                                ? `${network.label} - Connect wallet to bridge`
                                                : network.label}
                                        </span>
                                        <CheckIcon
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                value === network.value
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                            )}
                                        />
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
