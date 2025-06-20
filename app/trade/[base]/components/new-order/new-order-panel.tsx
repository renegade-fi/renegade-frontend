import { Lock } from "lucide-react";
import * as React from "react";

import { AssetsSectionWithDepositButton } from "@/app/trade/[base]/components/new-order/assets-section";
import { NewOrderForm } from "@/app/trade/[base]/components/new-order/new-order-form";

import {
    type NewOrderConfirmationProps,
    NewOrderStepper,
} from "@/components/dialogs/order-stepper/desktop/new-order-stepper";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles";

export function NewOrderPanel({ base }: { base: `0x${string}` }) {
    const [open, setOpen] = React.useState(false);
    const [lockedFormValues, setLockedFormValues] =
        React.useState<NewOrderConfirmationProps | null>(null);

    const handleSubmit = (values: NewOrderConfirmationProps) => {
        setLockedFormValues(values);
        setOpen(true);
    };

    return (
        <aside className="space-y-6">
            <div className="px-6 pt-6 text-sm">
                <AssetsSectionWithDepositButton base={base} />
            </div>
            <Separator />
            <NewOrderForm base={base} onSubmit={handleSubmit} />
            {lockedFormValues && (
                <NewOrderStepper {...lockedFormValues} open={open} setOpen={setOpen} />
            )}
            <div className="px-6">
                <Button
                    asChild
                    className="text-pretty p-0 text-xs text-muted-foreground"
                    variant="link"
                >
                    <a href={HELP_CENTER_ARTICLES.PRIVACY.url} rel="noreferrer" target="_blank">
                        <Lock className="mr-2 h-3 w-3" />
                        All orders are pre-trade and post-trade private.
                    </a>
                </Button>
            </div>
        </aside>
    );
}
