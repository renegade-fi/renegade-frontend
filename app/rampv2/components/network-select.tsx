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
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { getFormattedChainName } from "@/lib/viem";

interface NetworkSelectProps {
    value: number;
    onChange: (value: number) => void;
    networks: Array<number>;
}

export function NetworkSelect({ value, onChange, networks }: NetworkSelectProps) {
    const [open, setOpen] = React.useState(false);
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    const networkLabels = useMemo(() => {
        return networks.map((network) => {
            return { label: getFormattedChainName(network), value: network };
        });
    }, [networks]);

    return (
        <Popover modal open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    autoFocus
                    aria-expanded={open}
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
                            {networkLabels.map((network) => (
                                <CommandItem
                                    key={network.value}
                                    value={network.value.toString()}
                                    onSelect={(currentValue) => {
                                        onChange(Number(currentValue));
                                        setOpen(false);
                                    }}
                                >
                                    <span className="flex-1">{network.label}</span>
                                    <CheckIcon
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === network.value ? "opacity-100" : "opacity-0",
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
