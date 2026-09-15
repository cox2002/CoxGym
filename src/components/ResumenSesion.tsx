"use client";

import Link from "next/link";
import Icono from "@/components/Icono";
import { useCuenta } from "@/lib/cuenta";
import { reabrirSesion, useSesion } from "@/lib/entreno";
import { recordsDeLaSesion, resumirSesion } from "@/lib/estadisticas";
import { reloj } from "@/lib/fechas";
import { numero, toneladas } from "@/lib/formato";
import { useHistorialEntreno } from "@/lib/historial";
import { useHoy } from "@/lib/hoy";
import { getEjercicioPorId } from "@/lib/rutina";
import { usePendientes } from "@/lib/sincronizacion";
import type { DiaRutina } from "@/types/rutina";

interface Props {
  dia: DiaRutina;
}

/** Pantalla final de la sesión: duración, series, volumen y récords batidos. */
export default function ResumenSesion({ dia }: Props) {
  const hoy = useHoy();
  const sesion = useSesion(hoy?.fecha ?? null, dia.dia);
  const historial = useHistorialEntreno();
  const { usuario } = useCuenta();
  const pendientes = usePendientes();

  if (!hoy) return null;

  if (!sesion) {
    return (
      <div className="animate-entra px-[30px] pt-[60px] text-center">
        <h1 className="text-[22px] font-extrabold">Sin sesión hoy</h1>
        <p className="mt-2 text-[13.5px] text-tenue">
          Todavía no registraste {dia.titulo.toLowerCase()} hoy.
        </p>
        <Link
          href={`/dia/${dia.dia}`}
          className="mt-6 block rounded-[18px] bg-acento p-4 text-[15px] font-extrabold text-sobre-acento"
        >
          Ver el día
        </Link>
      </div>
    );
  }

  const resumen = resumirSesion(sesion, dia);
  const records = recordsDeLaSesion(historial, sesion.fecha, sesion.dia);

  const filas = [
    { etiqueta: "Duración", valor: reloj(resumen.duracionSeg) },
    { etiqueta: "Ejercicios", valor: `${resumen.ejerciciosCompletos} / ${dia.ejercicios.length}` },
    { etiqueta: "Series completadas", valor: String(resumen.seriesHechas) },
    { etiqueta: "Volumen", valor: toneladas(resumen.volumenKg) },
  ];

  return (
    <div className="animate-entra px-[30px] pt-[60px] text-center">
      <div className="mx-auto flex size-[76px] animate-sello items-center justify-center rounded-full border border-acento-borde bg-acento-fondo text-acento">
        <Icono nombre="check" className="size-[34px]" grosor={2.6} />
      </div>
      <h1 className="mt-[22px] text-[27px] font-extrabold tracking-[-0.6px]">
        {sesion.terminadaEn ? "Sesión terminada" : "Sesión en curso"}
      </h1>
      <p className="mt-2 text-[13.5px] text-tenue">{dia.titulo}</p>

      <dl className="mt-7 grid gap-3.5 rounded-[22px] border border-borde bg-superficie p-[18px] text-left">
        {filas.map((fila) => (
          <div key={fila.etiqueta} className="flex items-baseline justify-between">
            <dt className="text-[12.5px] text-tenue">{fila.etiqueta}</dt>
            <dd className="text-[17px] font-bold tabular-nums">{fila.valor}</dd>
          </div>
        ))}
      </dl>

      {records.length > 0 && (
        <section className="mt-2 rounded-[22px] border border-acento-borde bg-[#0d1a22] p-[18px] text-left">
          <h2 className="flex items-center gap-2 text-[10.5px] font-bold tracking-[1.4px] text-acento-claro uppercase">
            <Icono nombre="trofeo" className="size-4" />
            {records.length === 1 ? "Récord nuevo" : `${records.length} récords nuevos`}
          </h2>
          <ul className="mt-2">
            {records.map((r) => (
              <li
                key={r.ejercicioId}
                className="flex items-baseline justify-between gap-3 border-b border-[#17303f] py-2.5 last:border-0"
              >
                <span className="text-[13.5px] font-semibold">
                  {getEjercicioPorId(r.ejercicioId)?.nombre ?? r.ejercicioId}
                </span>
                <span className="shrink-0 text-[15px] font-extrabold tabular-nums">
                  {numero(r.pesoKg, 2)} kg × {r.reps}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-4 text-xs text-apagado">
        {!usuario ? (
          <>
            Guardado solo en este teléfono.{" "}
            <Link href="/cuenta" className="font-bold text-acento">
              Inicia sesión
            </Link>{" "}
            para tenerlo en la nube.
          </>
        ) : pendientes > 0 ? (
          "Guardando en la nube…"
        ) : (
          "Guardado en la nube."
        )}
      </p>

      {sesion.terminadaEn ? (
        <>
          <Link
            href="/"
            className="mt-[22px] block rounded-[18px] bg-acento p-4 text-[15px] font-extrabold text-sobre-acento"
          >
            Listo
          </Link>
          <button
            type="button"
            onClick={() => reabrirSesion(sesion.fecha, sesion.dia)}
            className="mt-3 px-3 py-2 text-[12.5px] font-semibold text-apagado"
          >
            Seguir entrenando
          </button>
        </>
      ) : (
        <Link
          href={`/dia/${dia.dia}`}
          className="mt-[22px] block rounded-[18px] bg-acento p-4 text-[15px] font-extrabold text-sobre-acento"
        >
          Volver a la sesión
        </Link>
      )}
    </div>
  );
}
