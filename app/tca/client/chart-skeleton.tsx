import { GlyphLoadingIndicator } from "@/components/glyph-loading-indicator";

// Skeleton for loading state
export function ChartSkeleton() {
    return (
        <div className="h-full w-full relative">
            <GlyphLoadingIndicator />
        </div>
    );
}
