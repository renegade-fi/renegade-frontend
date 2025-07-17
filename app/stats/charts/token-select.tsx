import { Check, ChevronsUpDown } from "lucide-react";
import React, { useMemo } from "react";

import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { DISPLAY_TOKENS } from "@/lib/token";
import { cn } from "@/lib/utils";

type TokenSelectProps = {
    value: string;
    onChange: (value: `${string}`) => void;
    chainId: number;
};

export function TokenSelect({ value, onChange, chainId }: TokenSelectProps) {
    const [open, setOpen] = React.useState(false);

    const tokens = useMemo(() => {
        const res = new Set<string>(
            DISPLAY_TOKENS({
                hideHidden: true,
                hideStables: true,
                chainId: chainId ? chainId : undefined,
            }).map((token) => token.ticker),
        );

        return Array.from(res).map((ticker) => ({
            value: ticker,
            label: ticker,
        }));
    }, [chainId]);

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                <Button
                    aria-expanded={open}
                    className="px-2 font-serif text-2xl font-bold"
                    role="combobox"
                    type="button"
                    variant="ghost"
                >
                    <TokenIcon className="mr-2" size={22} ticker={value} />
                    {value ? value : "Select token"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
                <Command>
                    <CommandInput placeholder="Search token..." />
                    <CommandList>
                        <CommandEmpty>No token found.</CommandEmpty>
                        <CommandGroup>
                            {tokens.map((token) => (
                                <CommandItem
                                    key={token.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue as `0x${string}`);
                                        setOpen(false);
                                    }}
                                    value={token.value}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === token.value ? "opacity-100" : "opacity-0",
                                        )}
                                    />
                                    {token.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
