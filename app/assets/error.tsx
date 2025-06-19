"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorPage({
    error: _error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                reset();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [reset]);
    return (
        <div className="flex h-screen flex-col items-center justify-center space-y-4">
            <div className="text-center">
                <h1 className="mb-4 text-4xl font-bold">Oops!</h1>
                <p className="mb-8 text-muted-foreground">Something went wrong. Please try again.</p>
                <Button
                    className={cn("px-8 py-2")}
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                >
                    Try again
                </Button>
            </div>
        </div>
    );
}
