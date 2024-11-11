import { Loader2, AlertCircle } from "lucide-react"
import { useConnect } from "wagmi"

import { Button } from "@/components/ui/button"

import { useWalletOnboarding } from "../../context/wallet-onboarding-context"

export function LoadingPage() {
  const { error, setError, lastConnector } = useWalletOnboarding()
  const { connect, connectors } = useConnect({
    mutation: {
      onError: (error) => {
        setError(error.message)
      },
    },
  })

  const handleRetry = async () => {
    if (!lastConnector) return

    const connector = connectors.find((c) => c.uid === lastConnector)
    if (!connector) return

    setError(null)
    try {
      await connect({ connector })
    } catch (err) {
      // Error will be handled by the mutation onError callback
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRetry}
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm text-muted-foreground">
        Waiting for wallet interaction...
      </p>
    </div>
  )
}
