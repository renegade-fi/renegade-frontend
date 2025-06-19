import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Book } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

import { HELP_CENTER_BASE_URL } from "@/lib/constants/articles";

export function MobileNavSheet({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const handleLinkClick = (href: string) => {
        if (pathname.includes(href)) {
            setOpen(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent hideCloseButton className="w-[300px] p-0 !duration-100" side="left">
                <SheetHeader>
                    <VisuallyHidden>
                        <SheetTitle>Menu</SheetTitle>
                        <SheetDescription>Click on a link!</SheetDescription>
                    </VisuallyHidden>
                </SheetHeader>
                <div className="flex flex-col gap-8 p-8 text-xl">
                    <Link href="/trade" onClick={() => handleLinkClick("/trade")}>
                        <Image priority alt="logo" height="38" src="/glyph_dark.svg" width="31" />
                    </Link>
                    <Link
                        className="cursor-pointer hover:text-muted-foreground"
                        href="/trade"
                        onClick={() => handleLinkClick("/trade")}
                    >
                        Trade
                    </Link>
                    <Link
                        className="cursor-pointer hover:text-muted-foreground"
                        href="/assets"
                        onClick={() => handleLinkClick("/assets")}
                    >
                        Assets
                    </Link>
                    <Link
                        className="cursor-pointer hover:text-muted-foreground"
                        href="/orders"
                        onClick={() => handleLinkClick("/orders")}
                    >
                        Orders
                    </Link>
                    <Link
                        className="cursor-pointer hover:text-muted-foreground"
                        href="/stats"
                        onClick={() => handleLinkClick("/stats")}
                    >
                        Stats
                    </Link>
                    <a href={HELP_CENTER_BASE_URL} rel="noreferrer" target="_blank">
                        Help
                    </a>
                </div>
                <Separator />
                <div className="flex justify-between p-8">
                    <Button asChild size="icon" variant="ghost">
                        <a href="https://x.com/renegade_fi" rel="noreferrer" target="_blank">
                            <Image alt="x" height="16" src="/x.svg" width="16" />
                        </a>
                    </Button>
                    <Button asChild size="icon" variant="ghost">
                        <a href="https://github.com/renegade-fi/" rel="noreferrer" target="_blank">
                            <Image alt="github" height="16" src="/github.svg" width="16" />
                        </a>
                    </Button>
                    <Button asChild size="icon" variant="ghost">
                        <a
                            href="https://discord.com/invite/renegade-fi"
                            rel="noreferrer"
                            target="_blank"
                        >
                            <Image alt="discord" height="16" src="/discord.svg" width="16" />
                        </a>
                    </Button>
                    <Button asChild size="icon" variant="ghost">
                        <a href="https://renegade.fi/docs" rel="noreferrer" target="_blank">
                            <Book className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
