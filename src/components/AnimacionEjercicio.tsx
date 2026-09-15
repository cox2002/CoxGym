"use client";

import { useEffect, useRef, useState } from "react";
import MapaCuerpo from "@/components/MapaCuerpo";
import { CREDITO_ANIMACIONES, getInfoEjercicio } from "@/lib/ejercicios";
import type { Ejercicio } from "@/types/rutina";

interface Props {
  ejercicio: Ejercicio;
}

/**
 * Animación de la técnica. Mientras carga el GIF se ve la imagen fija (la
 * misma de la lista, ya en caché). Sin conexión y sin caché, queda el mapa
 * corporal con un aviso.
 */
export default function AnimacionEjercicio({ ejercicio }: Props) {
  const info = getInfoEjercicio(ejercicio.animacion);
  const [gifListo, setGifListo] = useState(false);
  const [gifFallo, setGifFallo] = useState(false);
  const [imagenFallo, setImagenFallo] = useState(false);
  const gif = useRef<HTMLImageElement>(null);

  // Si el GIF estaba en caché, pudo cargar antes de que React escuchara onLoad.
  useEffect(() => {
    if (gif.current?.complete && gif.current.naturalWidth > 0) setGifListo(true);
  }, []);

  const sinMedia = !info || (gifFallo && imagenFallo);

  return (
    <figure className="relative h-[226px] w-full overflow-hidden rounded-[22px] border border-borde bg-[#e8ecef]">
      {sinMedia ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#0d1216] px-6 text-center">
          <MapaCuerpo activos={ejercicio.musculos} className="h-[120px] w-[115px]" />
          <p className="text-xs text-apagado">
            {info
              ? "La animación se verá cuando haya conexión."
              : "Este ejercicio no tiene animación."}
          </p>
        </div>
      ) : (
        <>
          {!gifListo && !imagenFallo && (
            <img
              src={info.imagen}
              alt=""
              width={180}
              height={180}
              onError={() => setImagenFallo(true)}
              className="absolute inset-0 m-auto size-[200px] object-contain mix-blend-multiply"
            />
          )}
          {!gifFallo && (
            <img
              ref={gif}
              src={info.gif}
              alt={`Animación de la técnica: ${ejercicio.nombre}`}
              width={180}
              height={180}
              onLoad={() => setGifListo(true)}
              onError={() => setGifFallo(true)}
              className={`absolute inset-0 m-auto size-[200px] object-contain mix-blend-multiply transition-opacity duration-300 ${
                gifListo ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
          {!gifListo && !gifFallo && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#4d5966]">
              <span className="size-1.5 animate-latido rounded-full bg-[#0284c7]" />
              Cargando animación
            </div>
          )}
        </>
      )}

      {info && (
        <figcaption className="absolute right-3 bottom-2">
          <a
            href={CREDITO_ANIMACIONES.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[10.5px] font-semibold ${sinMedia ? "text-apagado" : "text-[#5c6874]"}`}
          >
            {CREDITO_ANIMACIONES.texto}
          </a>
        </figcaption>
      )}
    </figure>
  );
}
