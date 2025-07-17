import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog";
import { Button } from "@/components/ui/button";

import { useSignInAndConnect } from "@/hooks/use-sign-in-and-connect";
import { cn } from "@/lib/utils";

export function ConnectButton({ className }: { className?: string }) {
    const { handleClick, content, open, onOpenChange } = useSignInAndConnect();

    return (
        <>
            <Button
                className={cn(className)}
                onClick={(e) => {
                    e.preventDefault();
                    handleClick();
                }}
                size="xl"
                type="button"
            >
                {content}
            </Button>
            <SignInDialog onOpenChange={onOpenChange} open={open} />
        </>
    );
}
