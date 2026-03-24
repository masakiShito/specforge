/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@specforge/document-schema']
};

export default nextConfig;
