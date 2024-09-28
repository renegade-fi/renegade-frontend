import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Renegade",
    short_name: "Renegade",
    description:
      "Trade any ERC-20 with zero price impact. Renegade is a MPC-based dark pool, delivering zero slippage cryptocurrency trades via anonymous crosses at midpoint prices.",
    start_url: "/?source=pwa",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
