import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'oucyscfaqttdsoeyyvos.supabase.co',
      pathname: '/storage/v1/object/public/kversation-media/**',
    }],
  },
}
export default nextConfig
