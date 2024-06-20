export function BBOMarquee() {
  return (
    <div className="min-h-marquee flex w-full items-center justify-evenly whitespace-nowrap border-y border-input font-extended text-sm">
      <span>BBO Feeds</span>
      <span className="text-xs">•</span>
      <div className="space-x-6">
        <span>Binance</span>
        <span>$3,756.89</span>
        <span className="font-extended text-green-price">LIVE</span>
      </div>
      <span className="text-xs">•</span>
      <div className="space-x-6">
        <span>Coinbase</span>
        <span>$3,756.89</span>
        <span className="font-extended text-green-price">LIVE</span>
      </div>
      <span className="text-xs">•</span>
      <div className="space-x-6">
        <span>Kraken</span>
        <span>$3,756.89</span>
        <span className="font-extended text-green-price">LIVE</span>
      </div>
      <span className="text-xs">•</span>
      <div className="space-x-6">
        <span>Okx</span>
        <span>$3,756.89</span>
        <span className="font-extended text-green-price">LIVE</span>
      </div>
    </div>
  )
}
