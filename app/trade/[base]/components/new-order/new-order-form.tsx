import * as React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightLeft, ChevronDown } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  setSide as setSideCookies,
  setUseUSDC,
} from "@/app/trade/[base]/actions"
import { AmountShortcutButton } from "@/app/trade/[base]/components/new-order/amount-shortcut-button"
import { FeesSection } from "@/app/trade/[base]/components/new-order/fees-sections"

import { NewOrderStepper } from "@/components/dialogs/new-order-stepper/new-order-stepper"
import { TokenSelectDialog } from "@/components/dialogs/token-select-dialog"
import { NumberInput } from "@/components/number-input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { usePredictedFees } from "@/hooks/use-predicted-fees"

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
  side: string
  isUSDCDenominated?: boolean
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      base,
      isSell: side === "sell",
      isUSDCDenominated: isUSDCDenominated ?? false,
    },
  })
  const fees = usePredictedFees(form.watch())
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "isUSDCDenominated") {
        setUseUSDC(value.isUSDCDenominated ?? false)
        form.resetField("amount", { defaultValue: 0 })
      }
      if (name === "isSell") {
        setSideCookies(value.isSell ? "sell" : "buy")
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    form.trigger().then(isValid => {
      if (isValid) {
        setOpen(true)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="">
        <div className="flex">
          <FormField
            control={form.control}
            name="isSell"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Button
                    variant="outline"
                    className="w-full border-l-0 font-serif text-2xl font-bold"
                    size="xl"
                    {...field}
                    value={""}
                    onClick={e => {
                      e.preventDefault()
                      field.onChange(!field.value)
                    }}
                  >
                    {field.value ? "SELL" : "BUY"}
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
              className="flex-1 border-x-0 font-serif text-2xl font-bold"
              size="xl"
            >
              {base}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </TokenSelectDialog>
        </div>
        <div className="p-6">
          <Label className="font-sans text-muted-foreground">Amount</Label>
          <div className="flex items-baseline">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <NumberInput
                      className="rounded-none border-none px-0 text-right font-mono text-2xl placeholder:text-right focus-visible:ring-0"
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
        <div className="flex px-6 pb-6">
          <AmountShortcutButton
            {...form.watch()}
            className="flex-1"
            percentage={0.25}
            onSetAmount={amount => form.setValue("amount", amount)}
          />
          <AmountShortcutButton
            {...form.watch()}
            className="flex-1 border-x-0"
            percentage={0.5}
            onSetAmount={amount => form.setValue("amount", amount)}
          />
          <AmountShortcutButton
            {...form.watch()}
            className="flex-1"
            percentage={1}
            onSetAmount={amount => form.setValue("amount", amount)}
          />
        </div>
        <Separator />
        <div className="space-y-3 whitespace-nowrap p-6 text-sm text-muted-foreground">
          <FeesSection {...fees} />
        </div>
        <Button
          variant="outline"
          className="mx-auto flex px-6 font-extended text-3xl"
          size="xl"
        >
          {form.getValues("isSell") ? "Sell" : "Buy"} {base}
        </Button>
        <NewOrderStepper
          {...form.watch()}
          {...fees}
          onSuccess={() => form.reset()}
          open={open}
          setOpen={setOpen}
        />
      </form>
    </Form>
  )
}
