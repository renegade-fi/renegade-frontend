import Image from "next/image";
import type { Viewport } from "next/types";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1.0,
    maximumScale: 1.0,
    userScalable: false,
};

export default function M() {
    return (
        <div className="flex max-h-dvh min-h-dvh items-center justify-center overflow-hidden bg-black">
            <div className="flex flex-col gap-2">
                <div className="font-serif text-2xl text-muted-foreground">Unfortunately,</div>
                <Image alt="logo" height="45" priority src="/logo_dark.svg" width="288" />
                <div className="text-right font-serif text-lg text-muted-foreground">
                    is not yet available on mobile.
                </div>
            </div>
        </div>
    );
}
