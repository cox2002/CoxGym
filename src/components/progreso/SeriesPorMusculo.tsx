"use client";

import MapaCuerpo from "@/components/MapaCuerpo";
import Tarjeta, { Vacio } from "@/components/progreso/Tarjeta";
import { seriesPorMusculo } from "@/lib/estadisticas";
import { inicioSemana, sumarDias } from "@/lib/fechas";
import { numero } from "@/lib/formato";
import type { HistorialEntreno } from "@/lib/historial";
import { NOMBRE_MUSCULO } from "@/lib/musculos";
import type { Musculo } from "@/types/rutina";

interface Props {
  historial: HistorialEntreno;
  hoy: string;
}

/** Series de la semana por músculo: mapa corporal + barras horizontales. */
export default function SeriesPorMusculo({ historial, hoy }: Props) {
  const lunes = inicioSemana(hoy);
  const conteo = seriesPorMusculo(historial.series, lunes, sumarDias(lunes, 6));
  const lista = (Object.entries(conteo) as [Musculo, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const maximo = lista[0]?.[1] ?? 0;

  // En el mapa: fuerte lo más trabajado (la mitad superior), suave el resto.
  const activos = lista.filter(([, n]) => n >= maximo / 2).map(([m]) => m);
  const secundarios = lista.filter(([, n]) => n < maximo / 2).map(([m]) => m);

  return (
    <Tarjeta titulo="Series por músculo · esta semana">
      {lista.length === 0 ? (
        <Vacio>Aún no hay series esta semana.</Vacio>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <MapaCuerpo activos={activos} secundarios={secundarios} className="h-[150px] w-[112px] shrink-0" />
          <ul className="grid flex-1 gap-[11px]">
            {lista.slice(0, 6).map(([musculo, n]) => (
              <li key={musculo}>
                <div className="flex justify-between text-[11.5px] font-semibold text-suave">
                  <span>{NOMBRE_MUSCULO[musculo]}</span>
                  <span className="text-[#7b8794] tabular-nums">{numero(n, 1)}</span>
                </div>
                <div className="mt-[5px] h-1 rounded-[3px] bg-[#171d24]">
                  <div
                    className="h-full rounded-[3px] bg-acento"
                    style={{ width: `${(n / maximo) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {lista.length > 0 && (
        <p className="mt-3 text-[11px] text-apagado">
          El músculo principal de cada ejercicio suma 1 serie; los secundarios, 0,5.
        </p>
      )}
    </Tarjeta>
  );
}
