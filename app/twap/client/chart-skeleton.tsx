import { GlyphLoadingIndicator } from "@/components/glyph-loading-indicator";
import { Card, CardContent } from "@/components/ui/card";

export function RenegadeFillChartSkeleton() {
    return (
        <Card>
            <CardContent className="relative min-h-[400px]">
                <GlyphLoadingIndicator />
            </CardContent>
        </Card>
    );
}

export function PriceImprovementChartSkeleton() {
    return (
        <Card className="h-full flex flex-col">
            <CardContent className="relative flex-1">
                <GlyphLoadingIndicator />
            </CardContent>
        </Card>
    );
}
