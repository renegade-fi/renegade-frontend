export function TailwindIndicator() {
    if (process.env.NODE_ENV !== "development") {
        return null;
    }
    return (
        <div className="fixed right-0 top-0 z-50 rounded-bl bg-pink-500 px-2 font-mono text-white shadow-md">
            <span className="sm:hidden">default</span>
            <span className="hidden sm:inline md:hidden">sm</span>
            <span className="hidden md:inline lg:hidden">md</span>
            <span className="hidden lg:inline xl:hidden">lg</span>
            <span className="hidden xl:inline">xl</span>
        </div>
    );
}
