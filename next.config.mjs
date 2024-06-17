// /** @type {import('next').NextConfig} */
// const nextConfig = {}

// export default nextConfig
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   webpack: function (config, options) {
//     config.experiments = {
//       asyncWebAssembly: true,
//       //   buildHttp: true,
//       layers: true,
//       lazyCompilation: true,
//       //   outputModule: true,
//       syncWebAssembly: true,
//       topLevelAwait: true,
//     }
//     return config
//   },
// }

// export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: function (config, options) {
    config.experiments = {
      asyncWebAssembly: true,
      syncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    }
    config.resolve.fallback = {
      fs: false,
    }
    // Temporary WalletConnect outdated modules fix
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets-cdn.trustwallet.com',
        port: '',
        pathname: '/blockchains/ethereum/assets/**',
      },
    ],
  },
}

export default nextConfig
