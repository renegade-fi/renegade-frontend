import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog";
import { Button } from "@/components/ui/button";

import { useSignInAndConnect } from "@/hooks/use-sign-in-and-connect";
import { cn } from "@/lib/utils";

export function ConnectWalletButton({ className }: { className?: string }) {
    const { handleClick, content, open, onOpenChange } = useSignInAndConnect();

    return (
        <>
            <Button
                className={cn(
                    "border border-[#333333] font-extended text-base hover:border-[#999999]",
                    className,
                )}
                size="shimmer"
                variant="shimmer"
                onClick={handleClick}
            >
                {content}
            </Button>
            <SignInDialog open={open} onOpenChange={onOpenChange} />
        </>
    );
}
