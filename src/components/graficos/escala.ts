"use client";

import { useEffect, useRef, useState } from "react";

/** Ancho real del contenedor: los gráficos se dibujan en píxeles, sin deformar el texto. */
export function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const observador = new ResizeObserver(([entrada]) => {
      setAncho(Math.round(entrada.contentRect.width));
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return [ref, ancho] as const;
}

/** Paso "redondo" (1, 2, 2,5 o 5 × 10ⁿ) para que las marcas del eje sean números limpios. */
function pasoBonito(rango: number, marcas: number): number {
  const bruto = rango / Math.max(1, marcas);
  const magnitud = 10 ** Math.floor(Math.log10(bruto));
  const normal = bruto / magnitud;
  const factor = normal <= 1 ? 1 : normal <= 2 ? 2 : normal <= 2.5 ? 2.5 : normal <= 5 ? 5 : 10;
  return factor * magnitud;
}

/** Dominio y marcas del eje Y. `desdeCero` para barras (siempre crecen desde la base). */
export function escalaY(
  valores: number[],
  { desdeCero, marcas = 3 }: { desdeCero: boolean; marcas?: number },
): { min: number; max: number; ticks: number[] } {
  let min = desdeCero ? 0 : Math.min(...valores);
  let max = Math.max(...valores, desdeCero ? 1 : -Infinity);

  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, ticks: [0, 1] };
  if (min === max) {
    const holgura = Math.abs(min) * 0.05 || 1;
    min -= holgura;
    max += holgura;
  }

  const paso = pasoBonito(max - min, marcas);
  min = Math.floor(min / paso) * paso;
  max = Math.ceil(max / paso) * paso;

  const ticks: number[] = [];
  for (let v = min; v <= max + paso / 2; v += paso) ticks.push(Math.round(v * 1000) / 1000);
  return { min, max, ticks };
}
