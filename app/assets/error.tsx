"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorPage({ reset }: { reset: () => void }) {
    return (
        <div className="flex h-screen flex-col items-center justify-center space-y-4">
            <div className="text-center">
                <h1 className="mb-4 text-4xl font-bold">Oops!</h1>
                <p className="mb-8 text-muted-foreground">
                    Something went wrong. Please try again.
                </p>
                <Button className={cn("px-8 py-2")} onClick={() => reset()}>
                    Try again
                </Button>
            </div>
        </div>
    );
}
