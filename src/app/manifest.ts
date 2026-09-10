import type { MetadataRoute } from "next";

// Con `output: 'export'` el manifest se escribe como archivo al compilar.
export const dynamic = "force-static";

/** Hace la app instalable en la pantalla de inicio del celular. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CoxGym · Mi rutina",
    short_name: "CoxGym",
    description: "Mi rutina de gimnasio, día por día.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0d11",
    theme_color: "#0a0d11",
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
