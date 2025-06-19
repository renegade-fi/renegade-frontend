import React from "react";

export function PrivacySpeedSpectrum() {
    const [position, setPosition] = React.useState(98);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setPosition(33);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex w-full flex-col gap-2">
            <div className="px-3 pt-3">
                <div className="relative">
                    {/* Base scale bar */}
                    <div className="h-2 w-full rounded-full bg-primary/20" />

                    {/* Position indicator line */}
                    <div
                        className="absolute left-0 top-0 h-full w-[2px] bg-primary transition-all duration-300 ease-out"
                        style={{
                            left: `${position}%`,
                            transform: `translateX(-50%)`,
                        }}
                    />

                    {/* Arrow indicator */}
                    <div
                        className="absolute top-0 transition-all duration-300 ease-out"
                        style={{
                            left: `${position}%`,
                            transform: `translateX(-50%) translateY(-8px)`,
                        }}
                    >
                        <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-primary border-l-transparent border-r-transparent" />
                    </div>
                </div>
            </div>

            <div className="flex w-full justify-between text-sm text-muted-foreground">
                <span>Speed</span>
                <span>Privacy</span>
            </div>
        </div>
    );
}
