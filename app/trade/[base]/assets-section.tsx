import { TokenIcon } from '@/components/token-icon'
import { formatNumber } from '@/lib/format'
import { useReadErc20BalanceOf } from '@/lib/generated'
import { Token } from '@renegade-fi/react'
import { useAccount } from 'wagmi'

export function AssetsSection({
  base,
  quote = 'USDC',
}: {
  base: string
  quote: string
}) {
  const { address } = useAccount()
  const { data: baseL2Balance } = useReadErc20BalanceOf({
    address: Token.findByTicker(base).address,
    args: [address ?? '0x'],
  })
  const formattedBaseL2Balance = formatNumber(
    baseL2Balance ?? BigInt(0),
    Token.findByTicker(base).decimals,
  )

  const { data: quoteL2Balance } = useReadErc20BalanceOf({
    address: Token.findByTicker(quote).address,
    args: [address ?? '0x'],
  })
  const formattedQuoteL2Balance = formatNumber(
    quoteL2Balance ?? BigInt(0),
    Token.findByTicker(quote).decimals,
  )

  return (
    <div className="p-6">
      <h2 className="mb-4">Your Assets</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <TokenIcon ticker={base} size={20} />
            <span>{base}</span>
          </div>
          <span>{formattedBaseL2Balance}</span>
        </div>
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <TokenIcon ticker={quote} size={20} />
            <span>{quote}</span>
          </div>
          <span>{formattedQuoteL2Balance}</span>
        </div>
      </div>
    </div>
  )
}
