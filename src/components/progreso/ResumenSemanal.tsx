"use client";

import GraficoBarras from "@/components/graficos/GraficoBarras";
import Tarjeta, { Vacio } from "@/components/progreso/Tarjeta";
import { rachaSemanas, semanas } from "@/lib/estadisticas";
import { diasEntre, fechaCorta, sumarDias } from "@/lib/fechas";
import { numero, toneladas } from "@/lib/formato";
import type { HistorialEntreno } from "@/lib/historial";
import { getSemana } from "@/lib/rutina";

interface Props {
  historial: HistorialEntreno;
  hoy: string;
}

function Stat({ etiqueta, valor, unidad, nota }: { etiqueta: string; valor: string; unidad?: string; nota?: string }) {
  return (
    <div className="rounded-[20px] border border-borde bg-superficie p-[15px]">
      <p className="text-[11px] font-semibold text-tenue">{etiqueta}</p>
      <p className="mt-[7px] text-[27px] leading-none font-extrabold tracking-[-0.8px]">
        {valor}
        {unidad && <span className="text-[13px] font-semibold tracking-normal text-tenue"> {unidad}</span>}
      </p>
      {nota && <p className="mt-2 text-[11px] font-semibold text-tenue">{nota}</p>}
    </div>
  );
}

/** "8/9" para el eje; es corto y cabe bajo 8 columnas en un teléfono. */
function etiquetaEje(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${Number(dia)}/${Number(mes)}`;
}

export default function ResumenSemanal({ historial, hoy }: Props) {
  const lista = semanas(historial, hoy, 8);
  const actual = lista[lista.length - 1];
  const pasada = lista[lista.length - 2];
  const racha = rachaSemanas(historial, hoy);
  const planificadas = getSemana().filter((d) => d.tipo === "entrenamiento").length;

  // La semana en curso está a medias: se compara con la pasada hasta el mismo día.
  const hastaMismoDia = sumarDias(pasada.inicio, diasEntre(actual.inicio, hoy));
  const pasadaHastaHoy = historial.series
    .filter((s) => s.fecha >= pasada.inicio && s.fecha <= hastaMismoDia)
    .reduce((total, s) => total + (s.peso_kg ?? 0) * (s.reps ?? 0), 0);
  const cambio =
    pasadaHastaHoy > 0 ? ((actual.volumenKg - pasadaHastaHoy) / pasadaHastaHoy) * 100 : null;
  const textoCambio =
    cambio === null ? "" : `${cambio >= 0 ? "▲" : "▼"} ${numero(Math.abs(cambio), 0)} % vs. hace 7 días`;

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Stat etiqueta="Racha" valor={String(racha)} unidad={racha === 1 ? "semana" : "sem."} />
        <Stat etiqueta="Volumen esta semana" valor={numero(actual.volumenKg / 1000, 1)} unidad="t" />
        <Stat etiqueta="Sesiones esta semana" valor={String(actual.sesiones)} unidad={`/ ${planificadas}`} />
        <Stat etiqueta="Series esta semana" valor={String(actual.series)} />
      </div>

      <Tarjeta
        titulo="Volumen semanal"
        extra={
          textoCambio && (
            <span className="text-[11.5px] font-bold text-suave tabular-nums">{textoCambio}</span>
          )
        }
      >
        {lista.every((s) => s.volumenKg === 0) ? (
          <Vacio>Marca series con peso y aquí verás cuánto levantas cada semana.</Vacio>
        ) : (
          <>
            <div className="mt-3">
              <GraficoBarras
                titulo="Volumen levantado por semana"
                barras={lista.map((s) => ({
                  clave: s.inicio,
                  etiqueta: etiquetaEje(s.inicio),
                  descripcion: `Semana del ${fechaCorta(s.inicio)} · ${s.series} series`,
                  valor: s.volumenKg,
                }))}
                destacada={actual.inicio}
                formatear={toneladas}
                formatearEje={(kg) => (kg === 0 ? "0" : `${numero(kg / 1000, 1)} t`)}
              />
            </div>
            <p className="mt-2 text-[11px] text-apagado">
              Volumen = kilos × repeticiones de cada serie hecha. El cambio compara con la semana
              pasada hasta el mismo día.
            </p>
          </>
        )}
      </Tarjeta>
    </>
  );
}
