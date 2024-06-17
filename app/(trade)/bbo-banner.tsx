import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { ResponsiveLine } from '@nivo/line'
import { Header } from '@/app/header'
import { Footer } from '@/app/footer'

export function BBOBanner() {
  return (
    <div className="flex items-center space-x-2">
      <span>BBO Feeds</span>
      <span>•</span>
      <span>Binance</span>
      <span>$3,756.89</span>
      <Badge variant="default">LIVE</Badge>
      <span>•</span>
      <span>Coinbase</span>
      <span>$3,756.89</span>
      <Badge variant="default">LIVE</Badge>
      <span>•</span>
      <span>Kraken</span>
      <span>$3,756.89</span>
      <Badge variant="default">LIVE</Badge>
      <span>•</span>
      <span>Okx</span>
      <span>$3,756.89</span>
      <Badge variant="default">LIVE</Badge>
    </div>
  )
}
