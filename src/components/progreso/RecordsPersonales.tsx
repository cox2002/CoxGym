"use client";

import Tarjeta, { Vacio } from "@/components/progreso/Tarjeta";
import { recordsPersonales } from "@/lib/estadisticas";
import { haceCuanto } from "@/lib/fechas";
import { numero } from "@/lib/formato";
import type { HistorialEntreno } from "@/lib/historial";
import { getEjercicioPorId } from "@/lib/rutina";

interface Props {
  historial: HistorialEntreno;
  hoy: string;
}

const CUANTOS = 5;

/** La mejor serie de cada ejercicio, empezando por los récords más recientes. */
export default function RecordsPersonales({ historial, hoy }: Props) {
  const records = recordsPersonales(historial.series).slice(0, CUANTOS);

  return (
    <Tarjeta titulo="Récords personales">
      {records.length === 0 ? (
        <Vacio>Tus mejores series con peso aparecerán aquí.</Vacio>
      ) : (
        <ul className="mt-1">
          {records.map((r) => (
            <li
              key={r.ejercicioId}
              className="flex items-center justify-between gap-3 border-b border-[#171d24] py-[11px] last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold">
                  {getEjercicioPorId(r.ejercicioId)?.nombre ?? r.ejercicioId}
                </p>
                <p className="mt-[3px] text-[11px] text-apagado">
                  {haceCuanto(r.fecha, hoy)} · 1RM est. {numero(r.e1rm, 1)} kg
                </p>
              </div>
              <p className="shrink-0 text-[17px] font-extrabold tabular-nums">
                {numero(r.pesoKg, 2)}
                <span className="text-[12px] font-semibold text-tenue"> kg × {r.reps}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
