/** @type {import('next').NextConfig} */
const nextConfig = {
  // Si compila en Vercel, desactiva 'export' para levantar la API en la nube
  output: process.env.VERCEL ? undefined : 'export',
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
