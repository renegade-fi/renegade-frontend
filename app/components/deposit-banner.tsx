import { ArrowRight } from "lucide-react";
import React from "react";

import { RampDialog } from "@/app/rampv2/ramp-dialog";
import { Button } from "@/components/ui/button";

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { useChainName } from "@/hooks/use-chain-name";
import { useMediaQuery } from "@/hooks/use-media-query";

export function DepositBanner() {
    const [isVisible, setIsVisible] = React.useState(false);
    const { data } = useBackOfQueueWallet({
        query: {
            select: (data) => data.balances.length,
        },
    });
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    React.useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        if (data === 0) {
            timeoutId = setTimeout(() => setIsVisible(true), 100);
        } else {
            setIsVisible(false);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [data]);

    const chainName = useChainName(true /* short */);
    const content = `Welcome to Renegade! Deposit your ${chainName} tokens to get started.`;

    if (isDesktop) {
        return (
            <div
                className={`transition-all duration-300 ease-in ${
                    isVisible ? "max-h-20 opacity-100" : "max-h-0 overflow-hidden opacity-0"
                }`}
            >
                <div className="flex w-full items-center border-b border-border bg-[#00183e] py-2 pl-4 text-sm text-blue lg:py-0">
                    <div>{content}</div>
                    <RampDialog>
                        <Button className="text-blue" variant="link">
                            Deposit now
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </RampDialog>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`transition-all duration-300 ease-in ${
                isVisible ? "max-h-20 opacity-100" : "max-h-0 overflow-hidden opacity-0"
            }`}
        >
            <div className="flex w-full items-center text-pretty border-b border-border bg-[#00183e] py-2 pl-4 pr-2 text-sm text-blue lg:py-0">
                <RampDialog>
                    <div>{content}</div>
                </RampDialog>
            </div>
        </div>
    );
}
