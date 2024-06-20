import { TokenIcon } from '@/components/token-icon'

export function AssetsSection({ base }: { base: string }) {
  return (
    <div className="p-6">
      <h2 className="mb-4">Your Assets</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <TokenIcon ticker={base} size={20} />
            <span>{base}</span>
          </div>
          <span>1,785</span>
        </div>
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <TokenIcon ticker="USDC" size={20} />
            <span>USDC</span>
          </div>
          <span>176,911.00</span>
        </div>
      </div>
    </div>
  )
}
