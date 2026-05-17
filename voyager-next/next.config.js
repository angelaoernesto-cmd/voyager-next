/** @type {import('next').NextConfig} */
const nextConfig = {
  // Si se ejecuta en internet (Vercel), desactiva el modo export para que funcione la API.
  // Si compila en tu ordenador, activa 'export' para meter los archivos en el móvil.
  output: process.env.VERCEL ? undefined : 'export',
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
