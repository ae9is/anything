/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Build static export of app
  // ref: https://nextjs.org/docs/app/building-your-application/deploying/static-exports#configuration
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