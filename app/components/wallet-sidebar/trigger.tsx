import { PanelRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

import { useWallets } from "@/hooks/use-wallets";

export function SidebarTrigger() {
    const { toggleSidebar } = useSidebar();
    const { arbitrumWallet: wallet } = useWallets();

    return (
        <Button className="group gap-2" onClick={toggleSidebar} variant="outline">
            <span className="flex items-center justify-center gap-2">
                <PanelRight className="h-4 w-4" />
                {wallet.label}
            </span>
        </Button>
    );
}
