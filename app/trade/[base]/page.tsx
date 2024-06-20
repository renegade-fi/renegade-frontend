import { PageClient } from '@/app/trade/[base]/page-client'
import { TokensMarquee } from '@/app/trade/[base]/tokens-marquee'
import { Footer } from '@/app/footer'
import { Header } from '@/app/header'
import { cookies } from 'next/headers'

export default function Page({ params }: { params: { base: string } }) {
  const layout = cookies().get('react-resizable-panels:layout')

  let defaultLayout
  if (layout) {
    defaultLayout = JSON.parse(layout.value)
  }

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto_auto]">
      <div className="min-h-20">
        <Header />
      </div>
      <PageClient defaultLayout={defaultLayout} base={params.base} />
      <TokensMarquee />
      <div className="min-h-20">
        <Footer />
      </div>
    </div>
  )
}
