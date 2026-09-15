import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Arranque from "@/components/Arranque";
import NavInferior from "@/components/NavInferior";
import TemporizadorDescanso from "@/components/TemporizadorDescanso";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

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
    <html lang="es" className={manrope.variable}>
      <body className="min-h-dvh">
        <Arranque />
        {/* pb-32 deja aire para la nav fija y el temporizador de descanso. */}
        <main className="mx-auto max-w-md pt-[env(safe-area-inset-top)] pb-32">
          {children}
        </main>
        <TemporizadorDescanso />
        <NavInferior />
      </body>
    </html>
  );
}
