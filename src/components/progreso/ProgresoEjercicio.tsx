"use client";

import { useState } from "react";
import GraficoLinea from "@/components/graficos/GraficoLinea";
import Icono from "@/components/Icono";
import Tarjeta, { Vacio } from "@/components/progreso/Tarjeta";
import { progresoEjercicio } from "@/lib/estadisticas";
import { fechaCorta } from "@/lib/fechas";
import { numero } from "@/lib/formato";
import type { HistorialEntreno } from "@/lib/historial";
import { getEjercicioPorId } from "@/lib/rutina";

interface Props {
  historial: HistorialEntreno;
}

/** Evolución de un ejercicio: 1RM estimado (o repeticiones si es sin peso). */
export default function ProgresoEjercicio({ historial }: Props) {
  // Ejercicios con registros, el más reciente primero.
  const ultimaFecha = new Map<string, string>();
  for (const serie of historial.series) {
    const previa = ultimaFecha.get(serie.ejercicio_id);
    if (!previa || serie.fecha > previa) ultimaFecha.set(serie.ejercicio_id, serie.fecha);
  }
  const opciones = [...ultimaFecha.entries()]
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([id]) => ({ id, nombre: getEjercicioPorId(id)?.nombre ?? id }));

  const [elegido, setElegido] = useState<string | null>(null);
  const actual = opciones.find((o) => o.id === elegido) ?? opciones[0];

  if (!actual) {
    return (
      <Tarjeta titulo="Progreso por ejercicio">
        <Vacio>Cuando marques series, aquí verás cómo sube cada ejercicio.</Vacio>
      </Tarjeta>
    );
  }

  const puntos = progresoEjercicio(historial.series, actual.id);
  const conPeso = puntos.some((p) => p.e1rm > 0);
  const mejor = conPeso
    ? puntos.reduce((a, b) => (b.e1rm > a.e1rm ? b : a))
    : puntos.reduce((a, b) => (b.repsMax > a.repsMax ? b : a));

  return (
    <Tarjeta titulo="Progreso por ejercicio">
      <label className="relative mt-3 block">
        <span className="sr-only">Ejercicio</span>
        <select
          value={actual.id}
          onChange={(e) => setElegido(e.target.value)}
          className="w-full appearance-none rounded-xl border border-borde-alto bg-campo py-2.5 pr-9 pl-3 text-base font-semibold text-texto"
        >
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </select>
        <Icono
          nombre="adelante"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 rotate-90 text-tenue"
        />
      </label>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-tenue">
            {conPeso ? "Mejor 1RM estimado" : "Más repeticiones"}
          </p>
          <p className="mt-1 text-[25px] leading-none font-extrabold tracking-[-0.7px]">
            {conPeso ? numero(mejor.e1rm, 1) : mejor.repsMax}
            <span className="text-[13px] font-semibold tracking-normal text-tenue">
              {conPeso ? " kg" : " reps"}
            </span>
          </p>
        </div>
        <p className="text-right text-[11.5px] text-tenue">
          {conPeso && (
            <span className="block font-semibold text-suave tabular-nums">
              {numero(mejor.pesoKg, 2)} kg × {mejor.reps}
            </span>
          )}
          {fechaCorta(mejor.fecha)}
        </p>
      </div>

      <div className="mt-3">
        {puntos.length > 1 ? (
          <GraficoLinea
            titulo={`${actual.nombre}: ${conPeso ? "1RM estimado" : "repeticiones"} por sesión`}
            puntos={puntos.map((p) => ({
              fecha: p.fecha,
              valor: conPeso ? p.e1rm : p.repsMax,
              detalle: conPeso ? `${numero(p.pesoKg, 2)} kg × ${p.reps}` : undefined,
            }))}
            formatear={(v) => (conPeso ? `${numero(v, 1)} kg` : `${numero(v, 0)} reps`)}
            formatearEje={(v) => numero(v, 1)}
          />
        ) : (
          <Vacio>Registra este ejercicio una vez más para ver la curva.</Vacio>
        )}
      </div>
      {conPeso && (
        <p className="mt-2 text-[11px] text-apagado">
          1RM estimado: el peso máximo para una repetición según tu mejor serie (fórmula de Epley).
        </p>
      )}
    </Tarjeta>
  );
}
