/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  // Solo aplica exportación estática si ejecutamos el script del móvil
  ...(process.env.NEXT_OUTPUT === 'export' ? { output: 'export' } : {}),
};

module.exports = nextConfig;
