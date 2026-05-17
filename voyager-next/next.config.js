/** @type {import('next').NextConfig} */
const nextConfig = {
  // Si compila en Vercel, desactiva 'export' para que cree la API.
  // Si compila en tu ordenador, activa 'export' para generar la carpeta 'out' del móvil.
  output: process.env.VERCEL ? undefined : 'export',
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
