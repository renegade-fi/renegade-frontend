import { TokensMarquee } from '@/app/(trade)/tokens-marquee'
import { cookies } from 'next/headers'

import { Footer } from '@/app/footer'
import { Header } from '@/app/header'
import { PageClient } from '@/app/(trade)/page-client'

export default function Page() {
  const layout = cookies().get('react-resizable-panels:layout')

  let defaultLayout
  if (layout) {
    defaultLayout = JSON.parse(layout.value)
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <PageClient defaultLayout={defaultLayout} />
      </div>
      <TokensMarquee />
      <Footer />
    </div>
  )
}
