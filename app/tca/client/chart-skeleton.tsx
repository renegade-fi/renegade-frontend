import { GlyphLoadingIndicator } from "@/components/glyph-loading-indicator";
import { Card, CardContent } from "@/components/ui/card";

export function PriceImprovementChartSkeleton() {
    return (
        <Card className="h-full border-none flex flex-col">
            <CardContent className="relative flex-1">
                <GlyphLoadingIndicator />
            </CardContent>
        </Card>
    );
}
