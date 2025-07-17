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
    webpack: (config, _options) => {
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
        return config;
    },
};

export default nextConfig;
