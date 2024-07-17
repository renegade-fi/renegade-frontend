import { PageClient } from "@/app/assets/page-client"
import { Footer } from "@/app/components/footer"
import { Header } from "@/app/components/header"

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
