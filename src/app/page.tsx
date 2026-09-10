"use client";

import { useEffect, useState } from "react";
import VistaDia from "@/components/VistaDia";
import { getFechaDeHoyTexto, getRutinaDeHoy } from "@/lib/rutina";
import type { DiaRutina } from "@/types/rutina";

interface Hoy {
  dia: DiaRutina;
  fecha: string;
}

function Esqueleto() {
  return (
    <div className="animate-pulse px-4 pt-6" aria-hidden="true">
      <div className="h-4 w-16 rounded bg-superficie-alta" />
      <div className="mt-3 h-8 w-40 rounded bg-superficie-alta" />
      <div className="mt-2 h-6 w-56 rounded bg-superficie-alta" />
      <div className="mt-6 space-y-3">
        <div className="h-32 rounded-2xl bg-superficie" />
        <div className="h-32 rounded-2xl bg-superficie" />
      </div>
    </div>
  );
}

export default function PaginaHoy() {
  const [hoy, setHoy] = useState<Hoy | null>(null);

  useEffect(() => {
    // El sitio es estático: si el día se calculara al compilar quedaría
    // congelado en la fecha del despliegue. Se resuelve en el navegador,
    // siempre con la hora de Lima.
    setHoy({ dia: getRutinaDeHoy(), fecha: getFechaDeHoyTexto() });
  }, []);

  if (!hoy) {
    return <Esqueleto />;
  }

  return <VistaDia dia={hoy.dia} sobretitulo={`Hoy · ${hoy.fecha}`} />;
}
