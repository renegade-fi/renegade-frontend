import { fileURLToPath } from "node:url";
import createJiti from "jiti";

// Only validaate env during build if not in CI
if (process.env.CI !== "true") {
    const jiti = createJiti(fileURLToPath(import.meta.url));
    jiti("./env/server");
    jiti("./env/client");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, _options) => {
        config.experiments = {
            asyncWebAssembly: true,
            syncWebAssembly: true,
            layers: true,
            topLevelAwait: true,
        };
        config.resolve.fallback = {
            fs: false,
        };
        // Temporary WalletConnect outdated modules fix
        config.externals.push("pino-pretty", "lokijs", "encoding");
        return config;
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "assets-cdn.trustwallet.com",
                port: "",
                pathname: "/blockchains/ethereum/assets/**",
            },
            {
                protocol: "https",
                hostname: "raw.githubusercontent.com",
                port: "",
                pathname: "/trustwallet/assets/master/blockchains/ethereum/assets/**",
            },
            {
                protocol: "https",
                hostname: "raw.githubusercontent.com",
                port: "",
                pathname: "/lifinance/types/main/src/assets/icons/**",
            },
            {
                protocol: "https",
                hostname: "raw.githubusercontent.com",
                port: "",
                pathname: "/renegade-fi/token-mappings/refs/heads/main/token-logos/**",
            },
        ],
    },
};

export default nextConfig;
