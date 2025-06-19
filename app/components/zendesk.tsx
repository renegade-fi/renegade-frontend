"use client";

import Script from "next/script";

import { useMediaQuery } from "@/hooks/use-media-query";

export function Zendesk() {
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    if (!isDesktop) return null;
    return (
        <Script
            id="ze-snippet"
            src="https://static.zdassets.com/ekr/snippet.js?key=0093b78b-22e2-475a-a370-a15a4b7bf55c"
            strategy="lazyOnload"
        />
    );
}
