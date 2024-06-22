import { Footer } from '@/app/footer'
import { Header } from '@/app/header'
import { PageClient } from '@/app/orders/page-client'

export default function Page() {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
      <div className="min-h-20">
        <Header />
      </div>
      <PageClient />
      <div className="min-h-20">
        <Footer />
      </div>
    </div>
  )
}
