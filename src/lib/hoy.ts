"use client";

import { useEffect, useState } from "react";
import { getDiaDeHoy, getFechaISOHoy } from "@/lib/rutina";
import type { DiaSemana } from "@/types/rutina";

export interface Hoy {
  /** "YYYY-MM-DD" en Lima. */
  fecha: string;
  dia: DiaSemana;
}

/**
 * Fecha y día de hoy en Lima. Es null en el primer render: el sitio es
 * estático y la fecha de compilación no sirve. Se actualiza si la app queda
 * abierta pasada la medianoche.
 */
export function useHoy(): Hoy | null {
  const [hoy, setHoy] = useState<Hoy | null>(null);

  useEffect(() => {
    const actualizar = () => {
      const fecha = getFechaISOHoy();
      setHoy((previo) => (previo?.fecha === fecha ? previo : { fecha, dia: getDiaDeHoy() }));
    };
    actualizar();
    const intervalo = setInterval(actualizar, 60_000);
    document.addEventListener("visibilitychange", actualizar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, []);

  return hoy;
}
