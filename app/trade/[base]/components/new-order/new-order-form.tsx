import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft, ChevronDown } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConnectButton } from "@/app/trade/[base]/components/connect-button";
import { AmountShortcutButton } from "@/app/trade/[base]/components/new-order/amount-shortcut-button";
import { DepositWarning } from "@/app/trade/[base]/components/new-order/deposit-warning";
import { FeesSection } from "@/app/trade/[base]/components/new-order/fees-sections";
import { MaxOrdersWarning } from "@/app/trade/[base]/components/new-order/max-orders-warning";
import { NoBalanceSlotWarning } from "@/app/trade/[base]/components/new-order/no-balance-slot-warning";
import { useIsMaxOrders } from "@/app/trade/[base]/components/new-order/use-is-max-orders";
import { orderFormEvents } from "@/app/trade/[base]/events/order-events";

import type { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper";
import { TokenSelectDialog } from "@/components/dialogs/token-select-dialog";
import { NumberInput } from "@/components/number-input";
import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { useOrderValue } from "@/hooks/use-order-value";
import { usePredictedFees } from "@/hooks/use-predicted-fees";
import { useWallets } from "@/hooks/use-wallets";
import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles";
import { Side } from "@/lib/constants/protocol";
import { MIDPOINT_TOOLTIP } from "@/lib/constants/tooltips";
import { formatCurrencyFromString } from "@/lib/format";
import { getCanonicalExchange, resolveAddress } from "@/lib/token";
import { useServerStore } from "@/providers/state-provider/server-store-provider";

const formSchema = z.object({
    amount: z
        .string()
        .min(1, { message: "Amount is required" })
        .refine(
            (value) => {
                const num = parseFloat(value);
                return !Number.isNaN(num) && num > 0;
            },
            { message: "Amount must be greater than zero" },
        ),
    base: z.string().refine((val): val is `0x${string}` => val.startsWith("0x"), {
        message: "Must start with 0x",
    }),
    isQuoteCurrency: z.boolean(),
    isSell: z.boolean(),
});

export type NewOrderFormProps = z.infer<typeof formSchema>;

export function NewOrderForm({
    base,
    onSubmit,
    closeButton,
}: {
    base: `0x${string}`;
    onSubmit: (values: NewOrderConfirmationProps) => void;
    closeButton?: React.ReactNode;
}) {
    // Form initializaiton
    const setSide = useServerStore((s) => s.setSide);
    const setCurrency = useServerStore((s) => s.setCurrency);
    const side = useServerStore((s) => s.order.side);
    const currency = useServerStore((s) => s.order.currency);
    const quoteMint = useServerStore((s) => s.quoteMint);
    const defaultValues = React.useMemo(
        () => ({
            amount: "",
            base,
            isQuoteCurrency: currency === "quote",
            isSell: side === Side.SELL,
        }),
        [side, currency, base],
    );
    const form = useForm<z.infer<typeof formSchema>>({
        defaultValues,
        resolver: zodResolver(formSchema),
    });
    // Keep form in sync with server store
    // TODO: This is an anti-pattern, we should use a single source of truth for the form (server state)
    React.useEffect(() => {
        form.setValue("isSell", side === Side.SELL);
        form.setValue("isQuoteCurrency", currency === "quote");
        form.setValue("base", base);
    }, [form, side, currency, base]);

    const isMaxOrders = useIsMaxOrders();
    const { walletReadyState } = useWallets();
    const fees = usePredictedFees(form.watch());
    const { valueInQuoteCurrency, valueInBaseCurrency } = useOrderValue(form.watch());
    const formattedOrderValue = Number(valueInQuoteCurrency)
        ? formatCurrencyFromString(valueInQuoteCurrency)
        : "--";
    const baseTicker = resolveAddress(base).ticker;
    const canonicalExchange = getCanonicalExchange(base);
    const receiveLabel = `${valueInBaseCurrency ? Number(valueInBaseCurrency) : "--"} ${baseTicker}`;

    React.useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "isQuoteCurrency") {
                setCurrency(value.isQuoteCurrency ? "quote" : "base");
                if (value.isQuoteCurrency) {
                    if (Number(valueInQuoteCurrency) > 0) {
                        form.setValue("amount", valueInQuoteCurrency);
                    }
                } else {
                    if (Number(valueInBaseCurrency) > 0) {
                        form.setValue("amount", valueInBaseCurrency);
                    }
                }
            }
            if (name === "isSell") {
                setSide(value.isSell ? Side.SELL : Side.BUY);
            }
        });
        return () => subscription.unsubscribe();
    }, [form, setCurrency, setSide, valueInBaseCurrency, valueInQuoteCurrency]);

    React.useEffect(() => {
        const unbind = orderFormEvents.on("reset", () => {
            form.reset({ ...defaultValues });
        });
        return unbind;
    }, [defaultValues, form]);

    const { data: hasBalances } = useBackOfQueueWallet({
        query: {
            select: (data) => {
                return data.balances.some(
                    (balance) =>
                        balance.amount > BigInt(0) &&
                        (balance.mint === base || balance.mint === quoteMint),
                );
            },
        },
    });

    function handleSubmit(values: z.infer<typeof formSchema>) {
        if (parseFloat(valueInQuoteCurrency) < 1) {
            form.setError("amount", {
                message: "Order value must be at least 1 USDC",
            });
            return;
        }

        form.trigger().then((isValid) => {
            if (isValid) {
                onSubmit({
                    ...values,
                    ...fees,
                    amount: values.isQuoteCurrency ? valueInBaseCurrency : values.amount,
                });
            }
        });
    }

    return (
        <Form {...form}>
            <form
                className="flex h-full flex-col gap-6 px-6"
                onSubmit={form.handleSubmit(handleSubmit)}
            >
                <div className="flex">
                    <FormField
                        control={form.control}
                        name="isSell"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Button
                                        className="w-full font-serif text-2xl font-bold tracking-tighter lg:tracking-normal"
                                        size="xl"
                                        type="button"
                                        variant="outline"
                                        {...field}
                                        onClick={() => field.onChange(!field.value)}
                                        value={""}
                                    >
                                        {field.value ? "Sell" : "Buy"}
                                        <ArrowRightLeft className="ml-2 h-5 w-5" />
                                    </Button>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <TokenSelectDialog mint={base}>
                        <Button
                            className="hidden flex-1 border-l-0 font-serif text-2xl font-bold lg:inline-flex"
                            size="xl"
                            variant="outline"
                        >
                            <TokenIcon className="mr-2" size={22} ticker={baseTicker} />
                            {baseTicker}
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </TokenSelectDialog>
                </div>
                <div>
                    <Label className="font-sans text-muted-foreground">Amount</Label>
                    <div className="flex">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <NumberInput
                                            className="h-12 rounded-none border-none px-0 text-right font-mono text-2xl placeholder:text-right focus-visible:ring-0"
                                            placeholder="0.00"
                                            {...field}
                                            type="number"
                                            value={field.value}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isQuoteCurrency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Button
                                            className="h-12 flex-1 rounded-none px-2 py-0 font-serif text-2xl font-bold tracking-tighter lg:tracking-normal"
                                            type="button"
                                            variant="ghost"
                                            {...field}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                field.onChange(!field.value);
                                            }}
                                            value={""}
                                        >
                                            {field.value ? "USDC" : baseTicker}
                                            <ArrowRightLeft className="ml-2 h-5 w-5" />
                                        </Button>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3">
                    <AmountShortcutButton
                        {...form.watch()}
                        onSetAmount={(amount) =>
                            form.setValue("amount", amount, { shouldValidate: true })
                        }
                        percentage={25}
                    />
                    <AmountShortcutButton
                        {...form.watch()}
                        className="border-x-0"
                        onSetAmount={(amount) =>
                            form.setValue("amount", amount, { shouldValidate: true })
                        }
                        percentage={50}
                    />
                    <AmountShortcutButton
                        {...form.watch()}
                        onSetAmount={(amount) =>
                            form.setValue("amount", amount, { shouldValidate: true })
                        }
                        percentage={100}
                    />
                </div>
                <MaxOrdersWarning className="text-sm text-orange-400" />
                <NoBalanceSlotWarning
                    baseMint={base}
                    className="text-sm text-orange-400"
                    isSell={form.getValues("isSell")}
                    quoteMint={quoteMint}
                />
                <DepositWarning
                    baseMint={base}
                    className="text-sm text-orange-400"
                    quoteMint={quoteMint}
                />

                {walletReadyState === "READY" ? (
                    <div className="hidden lg:block">
                        <MaintenanceButtonWrapper messageKey="place">
                            <Button
                                className="flex w-full font-serif text-2xl font-bold tracking-tighter lg:tracking-normal"
                                disabled={
                                    hasBalances === false || !form.formState.isValid || isMaxOrders
                                }
                                size="xl"
                                type="submit"
                                variant="default"
                            >
                                {form.getValues("isSell") ? "Sell" : "Buy"} {baseTicker}
                            </Button>
                        </MaintenanceButtonWrapper>
                    </div>
                ) : (
                    <ConnectButton className="flex w-full font-serif text-2xl font-bold tracking-tighter lg:tracking-normal" />
                )}

                <div className="space-y-3 whitespace-nowrap text-sm">
                    {form.getValues("isQuoteCurrency") ? (
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Est. Receive</div>
                            <div>{receiveLabel}</div>
                        </div>
                    ) : (
                        <></>
                    )}
                    <div className="flex items-center justify-between">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    asChild
                                    className="h-5 cursor-pointer p-0 text-sm text-muted-foreground"
                                    type="button"
                                    variant="link"
                                >
                                    <a
                                        href={HELP_CENTER_ARTICLES.MIDPOINT_PRICING.url}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        Type
                                    </a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{MIDPOINT_TOOLTIP(canonicalExchange)}</TooltipContent>
                        </Tooltip>
                        <div>Midpoint</div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-muted-foreground">Order Value</div>
                        <div>{formattedOrderValue}</div>
                    </div>
                    <FeesSection amount={form.watch("amount")} base={base} {...fees} />
                </div>
                <div className="mt-auto flex flex-row lg:hidden">
                    {closeButton}
                    <MaintenanceButtonWrapper messageKey="place" triggerClassName="flex-1">
                        <Button
                            className="w-full font-extended text-lg"
                            disabled={
                                hasBalances === false || !form.formState.isValid || isMaxOrders
                            }
                            size="xl"
                            type="submit"
                            variant="default"
                        >
                            {form.getValues("isSell") ? "Sell" : "Buy"} {baseTicker}
                        </Button>
                    </MaintenanceButtonWrapper>
                </div>
            </form>
        </Form>
    );
}
