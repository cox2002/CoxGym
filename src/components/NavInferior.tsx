"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHoy } from "@/lib/hoy";

type Seccion = "hoy" | "semana" | "progreso";

const OPCIONES: { seccion: Seccion; href: "/" | "/semana" | "/progreso"; etiqueta: string; icono: string }[] = [
  { seccion: "hoy", href: "/", etiqueta: "Hoy", icono: "M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8" },
  {
    seccion: "semana",
    href: "/semana",
    etiqueta: "Semana",
    icono: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3 10h18M8 3v4M16 3v4",
  },
  { seccion: "progreso", href: "/progreso", etiqueta: "Progreso", icono: "M4 19V6M4 19h16M8 19v-6M13 19V9M18 19v-4" },
];

function seccionActiva(ruta: string, diaDeHoy: string | undefined): Seccion {
  if (ruta.startsWith("/progreso") || ruta.startsWith("/cuenta")) return "progreso";
  if (ruta.startsWith("/semana")) return "semana";
  if (ruta.startsWith("/dia/")) {
    // Un ejercicio de la sesión de hoy sigue siendo "Hoy".
    return diaDeHoy && ruta.startsWith(`/dia/${diaDeHoy}`) ? "hoy" : "semana";
  }
  return "hoy";
}

export default function NavInferior() {
  const ruta = usePathname();
  const hoy = useHoy();
  const activa = seccionActiva(ruta, hoy?.dia);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#161d24] bg-fondo pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_22px_8px_#0a0d11]">
      <ul className="mx-auto grid max-w-md grid-cols-3 px-6">
        {OPCIONES.map((opcion) => {
          const activo = opcion.seccion === activa;
          return (
            <li key={opcion.href}>
              <Link
                href={opcion.href}
                aria-current={activo ? "page" : undefined}
                className={`flex flex-col items-center gap-1.5 pt-3 pb-2.5 text-[11px] font-bold tracking-wide transition-colors ${
                  activo ? "text-acento" : "text-apagado"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-[22px]"
                  aria-hidden="true"
                >
                  <path d={opcion.icono} />
                </svg>
                {opcion.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
