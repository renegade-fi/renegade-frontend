import * as React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useStatus } from "@renegade-fi/react"
import { ArrowRightLeft, ChevronDown } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  setBase,
  setIsUSDCDenominated,
  setSide,
} from "@/app/trade/[base]/actions"
import { ConnectButton } from "@/app/trade/[base]/components/connect-button"
import { AmountShortcutButton } from "@/app/trade/[base]/components/new-order/amount-shortcut-button"
import { FeesSection } from "@/app/trade/[base]/components/new-order/fees-sections"
import { MaxOrdersWarning } from "@/app/trade/[base]/components/new-order/max-orders-warning"
import { useIsMaxOrders } from "@/app/trade/[base]/components/new-order/use-is-max-orders"

import {
  NewOrderConfirmationProps,
  NewOrderStepper,
} from "@/components/dialogs/new-order-stepper/new-order-stepper"
import { TokenSelectDialog } from "@/components/dialogs/token-select-dialog"
import { NumberInput } from "@/components/number-input"
import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useOrderValue } from "@/hooks/use-order-value"
import { usePredictedFees } from "@/hooks/use-predicted-fees"
import { Side } from "@/lib/constants/protocol"
import { MIDPOINT_TOOLTIP } from "@/lib/constants/tooltips"
import { formatCurrency } from "@/lib/format"

const formSchema = z.object({
  amount: z.coerce
    .number({
      required_error: "You must submit an amount.",
      invalid_type_error: "Amount must be a number",
    })
    .gt(0, {
      message: "You must submit an amount greater than 0.",
    }),
  base: z.string(),
  isSell: z.boolean(),
  isUSDCDenominated: z.boolean(),
})

export type NewOrderFormProps = z.infer<typeof formSchema>

export function NewOrderForm({
  base,
  side,
  isUSDCDenominated,
}: {
  base: string
  side: Side
  isUSDCDenominated?: boolean
}) {
  const isMaxOrders = useIsMaxOrders()
  const status = useStatus()
  const defaultValues = {
    amount: 0,
    base,
    isSell: side === Side.SELL,
    isUSDCDenominated: isUSDCDenominated ?? false,
  }
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  const fees = usePredictedFees(form.watch())
  const [open, setOpen] = React.useState(false)
  const orderValue = useOrderValue(form.watch())
  const formattedOrderValue = orderValue ? formatCurrency(orderValue) : "--"

  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "isUSDCDenominated") {
        setIsUSDCDenominated(value.isUSDCDenominated ?? false)
        form.resetField("amount", { defaultValue: 0 })
      }
      if (name === "isSell") {
        setSide(value.isSell ? Side.SELL : Side.BUY)
        form.resetField("amount")
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  React.useEffect(() => {
    if (form.getValues("base")) {
      setBase(form.getValues("base"))
    }
  }, [form])

  const [lockedFormValues, setLockedFormValues] =
    React.useState<NewOrderConfirmationProps>({
      ...defaultValues,
      ...fees,
    })

  // TODO: Does this need more precision?
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (orderValue < 1) {
      form.setError("amount", {
        message: "Order value must be at least 1 USDC",
      })
      return
    }

    form.trigger().then(isValid => {
      if (isValid) {
        setLockedFormValues({
          ...values,
          ...fees,
        })
        setOpen(true)
      }
    })
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6">
          <div className="flex">
            <FormField
              control={form.control}
              name="isSell"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full font-serif text-2xl font-bold"
                      size="xl"
                      {...field}
                      value={""}
                      onClick={e => {
                        e.preventDefault()
                        field.onChange(!field.value)
                      }}
                    >
                      {field.value ? "Sell" : "Buy"}
                      <ArrowRightLeft className="ml-2 h-5 w-5" />
                    </Button>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <TokenSelectDialog>
              <Button
                variant="outline"
                className="flex-1 border-l-0 font-serif text-2xl font-bold"
                size="xl"
              >
                <TokenIcon ticker={base} size={22} className="mr-2" />
                {base}
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
                        value={field.value === 0 ? "" : field.value}
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isUSDCDenominated"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Button
                        variant="ghost"
                        className="h-12 flex-1 rounded-none px-2 py-0 font-serif text-2xl font-bold"
                        {...field}
                        value={""}
                        onClick={e => {
                          e.preventDefault()
                          field.onChange(!field.value)
                        }}
                      >
                        {field.value ? "USDC" : base}
                        <ArrowRightLeft className="ml-2 h-5 w-5" />
                      </Button>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex">
            <AmountShortcutButton
              {...form.watch()}
              className="flex-1"
              percentage={25}
              onSetAmount={amount =>
                form.setValue("amount", amount, { shouldValidate: true })
              }
            />
            <AmountShortcutButton
              {...form.watch()}
              className="flex-1 border-x-0"
              percentage={50}
              onSetAmount={amount =>
                form.setValue("amount", amount, { shouldValidate: true })
              }
            />
            <AmountShortcutButton
              {...form.watch()}
              className="flex-1"
              percentage={100}
              onSetAmount={amount =>
                form.setValue("amount", amount, { shouldValidate: true })
              }
            />
          </div>
          <MaxOrdersWarning className="text-sm text-orange-400" />
          {status === "in relayer" ? (
            <div>
              <Button
                variant="default"
                className="flex w-full font-serif text-2xl font-bold"
                size="xl"
                disabled={!form.formState.isValid || isMaxOrders}
              >
                {form.getValues("isSell") ? "Sell" : "Buy"} {base}
              </Button>
            </div>
          ) : (
            <ConnectButton className="flex w-full font-serif text-2xl font-bold" />
          )}
          <div className="space-y-3 whitespace-nowrap text-sm">
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger onClick={e => e.preventDefault()}>
                  <span className="text-muted-foreground">Type</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{MIDPOINT_TOOLTIP}</p>
                </TooltipContent>
              </Tooltip>
              <div>Midpoint</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Order Value</div>
              <div>{formattedOrderValue}</div>
            </div>
            <FeesSection amount={form.watch("amount")} {...fees} />
          </div>
          <NewOrderStepper
            {...lockedFormValues}
            onSuccess={() => form.reset()}
            open={open}
            setOpen={setOpen}
          />
        </form>
      </Form>
    </>
  )
}
