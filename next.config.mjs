import path from "node:path";
import { fileURLToPath } from "node:url";
import createJiti from "jiti";

// Only validaate env during build if not in CI
if (process.env.CI !== "true") {
    const jiti = createJiti(fileURLToPath(import.meta.url));
    jiti("./env/server");
    jiti("./env/client");
}

const TCA_ONLY = process.env.NEXT_PUBLIC_TCA_ONLY_MODE === "true";

// Absolute paths of every non-/tca, non-/api page.tsx file. In TCA-only
// builds, each is replaced by lib/tca-stub-page.tsx via webpack
// NormalModuleReplacementPlugin so the route still registers but the page
// itself unconditionally returns 404 — independent of middleware.
const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const NON_TCA_PAGE_PATHS = [
    "app/page.tsx",
    "app/trade/page.tsx",
    "app/trade/[base]/page.tsx",
    "app/assets/page.tsx",
    "app/orders/page.tsx",
    "app/rampv2/page.tsx",
    "app/(mobile)/m/page.tsx",
].map((rel) => path.join(PROJECT_ROOT, rel));
const STUB_PAGE_PATH = path.join(PROJECT_ROOT, "lib/tca-stub-page.tsx");

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                hostname: "assets-cdn.trustwallet.com",
                pathname: "/blockchains/ethereum/assets/**",
                port: "",
                protocol: "https",
            },
            {
                hostname: "raw.githubusercontent.com",
                pathname: "/trustwallet/assets/master/blockchains/ethereum/assets/**",
                port: "",
                protocol: "https",
            },
            {
                hostname: "raw.githubusercontent.com",
                pathname: "/lifinance/types/main/src/assets/icons/**",
                port: "",
                protocol: "https",
            },
            {
                hostname: "raw.githubusercontent.com",
                pathname: "/renegade-fi/token-mappings/refs/heads/main/token-logos/**",
                port: "",
                protocol: "https",
            },
            {
                hostname: "static.debank.com",
                pathname: "/image/**",
                port: "",
                protocol: "https",
            },
        ],
    },
    reactStrictMode: true,
    webpack: (config, { webpack }) => {
        config.experiments = {
            asyncWebAssembly: true,
            layers: true,
            syncWebAssembly: true,
            topLevelAwait: true,
        };
        config.resolve.fallback = {
            fs: false,
        };
        // Temporary WalletConnect outdated modules fix
        config.externals.push("pino-pretty", "lokijs", "encoding");

        if (TCA_ONLY) {
            // Replace every non-/tca page module with the stub. Matching is
            // done by absolute path to avoid accidentally hitting unrelated
            // page.tsx files in node_modules or elsewhere.
            config.plugins.push(
                new webpack.NormalModuleReplacementPlugin(/page\.tsx$/, (resource) => {
                    const requested = path.resolve(resource.context, resource.request);
                    if (NON_TCA_PAGE_PATHS.includes(requested)) {
                        resource.request = STUB_PAGE_PATH;
                    }
                }),
            );
        }

        return config;
    },
};

export default nextConfig;
