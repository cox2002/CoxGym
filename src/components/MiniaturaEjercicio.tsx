"use client";

import { useState } from "react";
import { getInfoEjercicio } from "@/lib/ejercicios";
import type { Ejercicio } from "@/types/rutina";

interface Props {
  ejercicio: Ejercicio;
  className?: string;
}

/**
 * Imagen fija del ejercicio sobre fondo claro. La imagen trae fondo blanco:
 * con mix-blend-multiply el blanco toma el color de la tarjeta.
 */
export default function MiniaturaEjercicio({ ejercicio, className = "size-14" }: Props) {
  const info = getInfoEjercicio(ejercicio.animacion);
  const [fallo, setFallo] = useState(false);

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl bg-[#e8ecef] ${className}`}>
      {info && !fallo ? (
        <img
          src={info.imagen}
          alt=""
          width={180}
          height={180}
          loading="lazy"
          decoding="async"
          onError={() => setFallo(true)}
          className="size-full object-contain mix-blend-multiply"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-superficie-alta text-lg font-bold text-apagado">
          {ejercicio.nombre.charAt(0)}
        </div>
      )}
    </div>
  );
}
