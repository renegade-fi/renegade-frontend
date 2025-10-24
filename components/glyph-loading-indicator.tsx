import Image from "next/image";

export function GlyphLoadingIndicator() {
    return (
        <Image
            alt="logo"
            className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 animate-pulse"
            height="57"
            priority
            src="/glyph_dark.svg"
            width="46"
        />
    );
}
