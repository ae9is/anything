/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  reactStrictMode: true,
  // Build static export of app
  // ref: https://nextjs.org/docs/app/building-your-application/deploying/static-exports#configuration
  // 
  // TODO Need to migrate off app router. App router (which was in experimental) regressed,
  //  and doesn't dynamic routing with static export right now. Breaks after next@13.4.19.
  // ref: https://github.com/vercel/next.js/issues/54393
  // ref: https://github.com/vercel/next.js/discussions/55393
  output: 'export',
  distDir: 'dist',
  // Only for Amplify Auth
  // ref: https://github.com/aws-amplify/amplify-cli/issues/7359
  trailingSlash: true,
}

// ref: https://www.npmjs.com/package/@next/bundle-analyzer
let config = nextConfig
if (process.env.CHECK_BUNDLE_SIZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
    openAnalyzer: true,
  })
  config = withBundleAnalyzer(nextConfig)
}

module.exports = config