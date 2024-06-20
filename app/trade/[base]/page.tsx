import { PageClient } from '@/app/trade/[base]/page-client'
import { TokensMarquee } from '@/app/trade/[base]/tokens-marquee'
import { Footer } from '@/app/footer'
import { Header } from '@/app/header'
import { cookies } from 'next/headers'
import { STORAGE_SIDE } from '@/lib/constants/storage'

export default function Page({ params }: { params: { base: string } }) {
  const layout = cookies().get('react-resizable-panels:layout')
  const side = cookies().get(STORAGE_SIDE)

  let defaultLayout
  if (layout) {
    defaultLayout = JSON.parse(layout.value)
  }

  let defaultSide
  if (side) {
    defaultSide = side.value
  }

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto_auto]">
      <div className="min-h-20">
        <Header />
      </div>
      <PageClient
        defaultLayout={defaultLayout}
        base={params.base}
        side={defaultSide}
      />
      <TokensMarquee />
      <div className="min-h-20">
        <Footer />
      </div>
    </div>
  )
}
