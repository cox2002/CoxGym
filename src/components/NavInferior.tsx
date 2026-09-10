"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const OPCIONES = [
  { href: "/", etiqueta: "Hoy" },
  { href: "/semana", etiqueta: "Semana" },
] as const;

function estaActiva(href: string, ruta: string): boolean {
  if (href === "/") return ruta === "/";
  // El detalle de un día (/dia/lunes) cuelga de la sección Semana.
  return ruta.startsWith("/semana") || ruta.startsWith("/dia");
}

function IconoHoy({ activo }: { activo: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={activo ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden="true"
    >
      <path d="M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8" />
    </svg>
  );
}

function IconoSemana({ activo }: { activo: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={activo ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export default function NavInferior() {
  const ruta = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-md">
        {OPCIONES.map((opcion) => {
          const activo = estaActiva(opcion.href, ruta);
          const Icono = opcion.href === "/" ? IconoHoy : IconoSemana;

          return (
            <li key={opcion.href} className="flex-1">
              <Link
                href={opcion.href}
                aria-current={activo ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-3 text-sm font-semibold transition-colors ${
                  activo ? "text-acento" : "text-tenue"
                }`}
              >
                <Icono activo={activo} />
                {opcion.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
