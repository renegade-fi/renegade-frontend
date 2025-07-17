import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        background_color: "#000000",
        description:
            "Trade any ERC-20 with zero price impact. Renegade is a MPC-based dark pool, delivering zero slippage cryptocurrency trades via anonymous crosses at midpoint prices.",
        display: "standalone",
        icons: [
            {
                sizes: "192x192",
                src: "/icons/android-chrome-192x192.png",
                type: "image/png",
            },
            {
                sizes: "512x512",
                src: "/icons/android-chrome-512x512.png",
                type: "image/png",
            },
        ],
        name: "Renegade",
        orientation: "portrait",
        scope: "/",
        short_name: "Renegade",
        start_url: "/?source=pwa",
        theme_color: "#000000",
    };
}
