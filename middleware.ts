import { type NextRequest, NextResponse } from "next/server";

const TCA_ONLY_MODE = process.env.NEXT_PUBLIC_TCA_ONLY_MODE === "true";

export function middleware(request: NextRequest) {
    if (!TCA_ONLY_MODE) {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;

    // Root: serve /tca content while keeping the URL bar at "/".
    if (pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = "/tca";
        return NextResponse.rewrite(url);
    }

    // Allow the TCA route tree and API routes (e.g. server actions, proxies).
    if (pathname === "/tca" || pathname.startsWith("/tca/") || pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    // 404 everything else. Next.js renders app/not-found.tsx when present.
    return new NextResponse(null, { status: 404 });
}

export const config = {
    // Skip static assets and Next.js internals; everything else hits the middleware.
    matcher: ["/((?!_next/|favicon\\.ico|manifest\\.webmanifest|static/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)"],
};
