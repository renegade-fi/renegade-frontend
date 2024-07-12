import * as React from 'react'

import { Label } from '@radix-ui/react-label'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Token, useBalances } from '@renegade-fi/react'
import { useAccount } from 'wagmi'

import { TokenSelect } from '@/components/dialogs/token-select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'

import { useApprove } from '@/hooks/use-approve'
import { useDeposit } from '@/hooks/use-deposit'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useWithdraw } from '@/hooks/use-withdraw'
import { formatNumber } from '@/lib/format'
import { useReadErc20BalanceOf } from '@/lib/generated'
import { cn } from '@/lib/utils'

export enum ExternalTransferDirection {
  Deposit,
  Withdraw,
}

export function TransferDialog({
  base,
  children,
}: {
  base?: `0x${string}`
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [direction, setDirection] = React.useState<ExternalTransferDirection>(
    ExternalTransferDirection.Deposit,
  )
  const [mint, setMint] = React.useState(base ?? '')
  const [amount, setAmount] = React.useState('')

  const { handleDeposit } = useDeposit({
    amount,
    mint,
  })

  const { handleWithdraw } = useWithdraw({
    amount,
    mint,
  })

  const { needsApproval, handleApprove } = useApprove({
    amount,
    mint,
    enabled: direction === ExternalTransferDirection.Deposit,
  })

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          hideCloseButton
          className="max-h-[80vh] gap-0 p-0 sm:max-w-[425px]"
          onPointerDownOutside={e => {
            // Prevent closing the dialog when clicking inside toast
            if (
              e.target instanceof Element &&
              e.target.closest('[data-sonner-toast]')
            ) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <div className="flex flex-row border-b border-border">
              <Button
                variant="outline"
                className={cn(
                  'flex-1 border-0 font-extended text-lg font-bold',
                  direction === ExternalTransferDirection.Deposit
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )}
                size="xl"
                onClick={() => setDirection(ExternalTransferDirection.Deposit)}
              >
                Deposit
              </Button>
              <Button
                variant="outline"
                className={cn(
                  'border-l-1 flex-1 border-y-0 border-r-0 font-extended text-lg font-bold',
                  direction === ExternalTransferDirection.Withdraw
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )}
                size="xl"
                onClick={() => setDirection(ExternalTransferDirection.Withdraw)}
              >
                Withdraw
              </Button>
            </div>
            <VisuallyHidden>
              <DialogTitle>
                {direction === ExternalTransferDirection.Deposit
                  ? 'Deposit'
                  : 'Withdraw'}
              </DialogTitle>
              <DialogDescription>
                {direction === ExternalTransferDirection.Deposit
                  ? 'Deposit tokens into Renegade'
                  : 'Withdraw tokens from Renegade'}
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <TransferForm
            className="p-6"
            direction={direction}
            amount={amount}
            onChangeAmount={setAmount}
            mint={mint}
            onChangeBase={setMint}
          />
          <DialogFooter>
            {direction === ExternalTransferDirection.Deposit ? (
              <Button
                variant="outline"
                className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
                size="xl"
                onClick={() => {
                  if (needsApproval) {
                    handleApprove({
                      onSuccess: () => {
                        handleDeposit({
                          onSuccess: () => {
                            setOpen(false)
                            setAmount('')
                          },
                        })
                      },
                    })
                  } else {
                    handleDeposit({
                      onSuccess: () => {
                        setOpen(false)
                        setAmount('')
                      },
                    })
                  }
                }}
              >
                {needsApproval ? 'Approve & Deposit' : 'Deposit'}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
                size="xl"
                onClick={() => {
                  handleWithdraw({
                    onSuccess: () => {
                      setOpen(false)
                      setAmount('')
                    },
                  })
                }}
              >
                Withdraw
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent hideHandle>
        <DrawerHeader className="p-0">
          <div className="flex flex-row border-b border-border">
            <Button
              variant="outline"
              className="flex-1 border-0 font-extended text-lg font-bold"
              size="xl"
              onClick={() => setDirection(ExternalTransferDirection.Deposit)}
            >
              Deposit
            </Button>
            <Button
              variant="outline"
              className="border-l-1 flex-1 border-y-0 border-r-0 font-extended text-lg font-bold"
              size="xl"
              onClick={() => setDirection(ExternalTransferDirection.Withdraw)}
            >
              Withdraw
            </Button>
          </div>
        </DrawerHeader>
        <TransferForm
          className="p-6"
          amount={amount}
          onChangeAmount={setAmount}
          direction={direction}
          mint={mint}
          onChangeBase={setMint}
        />
        <DrawerFooter className="pt-2">
          <Button>
            {direction === ExternalTransferDirection.Deposit
              ? 'Deposit'
              : 'Withdraw'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function TransferForm({
  className,
  amount,
  onChangeAmount,
  mint,
  direction,
  onChangeBase,
}: React.ComponentProps<'form'> & {
  amount: string
  onChangeAmount: (amount: string) => void
  mint: string
  direction: ExternalTransferDirection
  onChangeBase: (mint: string) => void
}) {
  const baseToken = mint
    ? // TODO: Will panic if mint is not a valid address
      Token.findByAddress(mint as `0x${string}`)
    : undefined
  const { address } = useAccount()

  const renegadeBalances = useBalances()
  const renegadeBalance = baseToken
    ? renegadeBalances.get(baseToken.address)?.amount
    : undefined

  const formattedRenegadeBalance = baseToken
    ? formatNumber(renegadeBalance ?? BigInt(0), baseToken.decimals)
    : ''

  const { data: l2Balance } = useReadErc20BalanceOf({
    address: baseToken?.address,
    args: [address ?? '0x'],
    query: {
      enabled:
        direction === ExternalTransferDirection.Deposit &&
        !!baseToken &&
        !!address,
    },
  })
  const formattedL2Balance = baseToken
    ? formatNumber(l2Balance ?? BigInt(0), baseToken.decimals)
    : ''

  const balance =
    direction === ExternalTransferDirection.Deposit
      ? formattedL2Balance
      : formattedRenegadeBalance

  const hideMaxButton = !mint || balance === '0' || amount === balance

  return (
    <div className={cn('space-y-8', className)}>
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="token">Token</Label>
        <TokenSelect
          direction={direction}
          value={mint}
          onChange={onChangeBase}
        />
      </div>
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="amount">Amount</Label>
        <div className="relative w-full ">
          <Input
            type="text"
            id="amount"
            placeholder="0.0"
            className={cn(
              'rounded-none font-mono w-full pr-12',
              hideMaxButton ? 'pr-12' : '',
            )}
            value={amount}
            onChange={e => onChangeAmount(e.target.value)}
          />
          {!hideMaxButton && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-muted-foreground"
              onClick={() => {
                onChangeAmount(balance)
              }}
            >
              <span>MAX</span>
            </Button>
          )}
        </div>
        <div className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {direction === ExternalTransferDirection.Deposit
              ? 'Arbitrum'
              : 'Renegade'}
            &nbsp;Balance
          </div>
          <Button
            variant="link"
            className="h-5 p-0"
            onClick={() => {
              onChangeAmount(balance)
            }}
          >
            <div className="font-mono text-sm">
              {baseToken ? `${balance} ${baseToken.ticker}` : '--'}
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}
