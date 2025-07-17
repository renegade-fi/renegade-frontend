import { CheckCircle, ExternalLink, Info, XCircle, Zap } from "lucide-react";
import React from "react";

import type { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { useIsMobile } from "@/hooks/use-mobile";
import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles";
import { useServerStore } from "@/providers/state-provider/server-store-provider";

import { PrivacySpeedSpectrum } from "./components/privacy-speed-spectrum";

export function ExternalMatchesSection(_props: NewOrderConfirmationProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const isMobile = useIsMobile();

    const handleMouseEnter = () => {
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        setIsOpen(false);
    };

    const allowExternalMatches = useServerStore((state) => state.allowExternalMatches);
    const setAllowExternalMatches = useServerStore((state) => state.setAllowExternalMatches);

    return (
        <Popover onOpenChange={setIsOpen} open={isOpen}>
            <PopoverTrigger asChild>
                <div
                    className="flex items-center justify-between border p-3 transition-colors hover:border-foreground"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="allow-external-matches">Allow external matches</Label>
                            <Info className="size-4 text-muted-foreground" />
                        </div>
                        <div className="text-[0.8rem] text-muted-foreground">
                            Get faster fills by matching with whitelisted solvers
                        </div>
                    </div>
                    <Switch
                        checked={allowExternalMatches}
                        id="allow-external-matches"
                        onCheckedChange={setAllowExternalMatches}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="space-y-2 rounded-none p-0 text-sm md:w-64"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                side={isMobile ? "bottom" : "right"}
            >
                <div className="grid h-20 place-items-center p-3">
                    <PrivacySpeedSpectrum />
                </div>
                <Separator />
                <div className="space-y-2 p-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                        <Zap className="h-5 w-5" />
                        External matches
                    </div>
                    <div>
                        {`External matches sacrifice some privacy for a faster fill: trades are visible on-chain after they execute.`}
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <span>Pre-trade Privacy:</span>
                            <CheckCircle className="size-4 text-green-500" />
                        </div>
                        <div className="flex items-center gap-1">
                            <span>Post-trade Privacy:</span>
                            <XCircle className="size-4 text-red-500" />
                        </div>
                    </div>
                    <a
                        className="inline-flex items-center underline-offset-4 transition-colors hover:text-foreground hover:underline hover:decoration-foreground"
                        href={HELP_CENTER_ARTICLES.EXTERNAL_MATCHES.url}
                        rel="noreferrer"
                        target="_blank"
                    >
                        Learn more about the tradeoffs
                        <ExternalLink className="ml-1 size-3" />
                    </a>
                </div>
            </PopoverContent>
        </Popover>
    );
}
