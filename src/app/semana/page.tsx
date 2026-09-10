"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDiaDeHoy, getSemana } from "@/lib/rutina";
import type { DiaSemana } from "@/types/rutina";

export default function PaginaSemana() {
  const semana = getSemana();
  // El día actual se resuelve en el navegador (ver comentario en "/").
  const [hoy, setHoy] = useState<DiaSemana | null>(null);

  useEffect(() => {
    setHoy(getDiaDeHoy());
  }, []);

  return (
    <div>
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-3xl font-bold">Semana</h1>
        <p className="mt-1 text-base text-tenue">
          Toca un día para ver la sesión completa.
        </p>
      </header>

      <ul className="space-y-3 px-4">
        {semana.map((dia) => {
          const esHoy = dia.dia === hoy;
          const esDescanso = dia.tipo === "descanso";

          return (
            <li key={dia.dia}>
              <Link
                href={`/dia/${dia.dia}`}
                className={`flex items-center gap-3 rounded-2xl border bg-superficie px-4 py-4 ${
                  esHoy ? "border-acento" : "border-borde"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{dia.nombreDia}</h2>
                    {esHoy && (
                      <span className="rounded-full bg-acento-tenue px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-acento">
                        Hoy
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-base text-tenue">
                    {dia.titulo}
                  </p>
                  <p className="mt-1 text-sm text-tenue">
                    {esDescanso
                      ? "Sin entrenamiento"
                      : `${dia.ejercicios.length} ejercicios`}
                  </p>
                </div>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 shrink-0 text-tenue"
                  aria-hidden="true"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
