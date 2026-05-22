/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  // Sin 'output' aquí — se controla desde package.json
};

module.exports = nextConfig;
