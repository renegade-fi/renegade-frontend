import { CheckIcon } from "@radix-ui/react-icons";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { arbitrum, base } from "viem/chains";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { cn } from "@/lib/utils";

const values = [
    {
        value: 0,
        label: "All Chains",
    },
    {
        value: arbitrum.id,
        label: "Arbitrum",
    },
    {
        value: base.id,
        label: "Base",
    },
];

export function ChainSelector({
    chainId,
    onChange,
}: {
    chainId: number | undefined;
    onChange: (chainId: number) => void;
}) {
    const [open, setOpen] = React.useState(false);
    return (
        <Popover modal onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                <Button
                    aria-expanded={open}
                    className="justify-between"
                    role="combobox"
                    size="default"
                    variant="outline"
                >
                    {chainId ? values.find((v) => v.value === chainId)?.label : "All Chains"}
                    <ChevronDown
                        className={cn(
                            "ml-2 h-4 w-4 shrink-0 transition-transform duration-200 ease-in-out",
                            open && "rotate-180",
                        )}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-fit p-0">
                <Command>
                    <CommandList>
                        <CommandGroup>
                            {values.map((chain) => (
                                <CommandItem
                                    key={chain.label}
                                    onSelect={() => {
                                        if (chain.value === chainId) {
                                            return;
                                        }
                                        onChange(chain.value);
                                        setOpen(false);
                                    }}
                                    value={chain.value.toString()}
                                >
                                    <span className="flex-1">{chain.label}</span>
                                    <CheckIcon
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            chainId === chain.value ? "opacity-100" : "opacity-0",
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
