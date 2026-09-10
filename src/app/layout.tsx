import type { Metadata, Viewport } from "next";
import NavInferior from "@/components/NavInferior";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoxGym",
  description: "Mi rutina de gimnasio, día por día.",
  applicationName: "CoxGym",
  appleWebApp: {
    capable: true,
    title: "CoxGym",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0d11",
  // Deja que el fondo llegue hasta los bordes en celulares con notch.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body className="min-h-dvh">
        {/* pb-24 deja aire para que la nav fija no tape el último ejercicio. */}
        <main className="mx-auto max-w-md pb-24">{children}</main>
        <NavInferior />
      </body>
    </html>
  );
}
