import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sitio 100% estático: `npm run build` deja el resultado en la carpeta out/.
  output: "export",
  // Sin servidor no hay optimización de imágenes en caliente.
  images: { unoptimized: true },
};

export default nextConfig;
