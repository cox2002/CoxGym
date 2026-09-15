"use client";

import VistaDia from "@/components/VistaDia";
import { useHoy } from "@/lib/hoy";
import { getDia } from "@/lib/rutina";

function Esqueleto() {
  return (
    <div className="animate-pulse px-[22px] pt-3.5" aria-hidden="true">
      <div className="h-3 w-40 rounded bg-superficie-alta" />
      <div className="mt-3 h-8 w-52 rounded bg-superficie-alta" />
      <div className="mt-3 flex gap-1.5">
        <div className="h-6 w-16 rounded-full bg-superficie-alta" />
        <div className="h-6 w-20 rounded-full bg-superficie-alta" />
      </div>
      <div className="mt-5 h-40 rounded-[22px] bg-superficie" />
      <div className="mt-6 space-y-2">
        <div className="h-[76px] rounded-[18px] bg-superficie" />
        <div className="h-[76px] rounded-[18px] bg-superficie" />
        <div className="h-[76px] rounded-[18px] bg-superficie" />
      </div>
    </div>
  );
}

export default function PaginaHoy() {
  // El sitio es estático: el día se resuelve en el navegador, en hora de Lima.
  const hoy = useHoy();
  const dia = hoy ? getDia(hoy.dia) : undefined;

  if (!dia) {
    return <Esqueleto />;
  }

  return <VistaDia dia={dia} />;
}
