"use client";

import Link from "next/link";
import Icono from "@/components/Icono";
import { inicioSemana, sumarDias } from "@/lib/fechas";
import { useHistorialEntreno } from "@/lib/historial";
import { useHoy } from "@/lib/hoy";
import { contarSeries, DIAS, getSemana } from "@/lib/rutina";
import type { DiaSemana } from "@/types/rutina";

const ABREVIATURA: Record<DiaSemana, string> = {
  lunes: "LUN",
  martes: "MAR",
  miercoles: "MIÉ",
  jueves: "JUE",
  viernes: "VIE",
  sabado: "SÁB",
  domingo: "DOM",
};

export default function PaginaSemana() {
  const semana = getSemana();
  const hoy = useHoy();
  const historial = useHistorialEntreno();

  const entrenos = semana.filter((d) => d.tipo === "entrenamiento");
  const libres = semana.filter((d) => d.tipo === "descanso").map((d) => d.nombreDia.toLowerCase());

  // Estado de cada día de la rutina esta semana: terminado (o con series en un
  // día que ya pasó) cuenta como hecho; con series pero sin terminar, en curso.
  const estado = new Map<DiaSemana, "hecho" | "en-curso">();
  if (hoy) {
    const lunes = inicioSemana(hoy.fecha);
    const domingo = sumarDias(lunes, 6);
    const conSeries = new Set(
      historial.series
        .filter((s) => s.fecha >= lunes && s.fecha <= domingo)
        .map((s) => `${s.fecha}|${s.dia}`),
    );
    for (const sesion of historial.sesiones) {
      if (sesion.fecha < lunes || sesion.fecha > domingo) continue;
      const tieneSeries = conSeries.has(`${sesion.fecha}|${sesion.dia}`);
      if (sesion.terminada_en || (tieneSeries && sesion.fecha < hoy.fecha)) {
        estado.set(sesion.dia, "hecho");
      } else if (tieneSeries && !estado.has(sesion.dia)) {
        estado.set(sesion.dia, "en-curso");
      }
    }
  }
  const hechosEntreno = entrenos.filter((d) => estado.get(d.dia) === "hecho").length;

  return (
    <div className="animate-entra px-[22px] pt-3.5">
      <header>
        <p className="text-[11px] font-bold tracking-[1.6px] text-apagado uppercase">Mi plan</p>
        <h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.6px]">Semana</h1>
        <p className="mt-2 text-[13px] text-tenue">
          {entrenos.length} días de entrenamiento
          {libres.length > 0 && ` · ${libres.join(" y ")} ${libres.length > 1 ? "libres" : "libre"}`}
        </p>
      </header>

      <section
        className="mt-[18px] rounded-[20px] border border-borde bg-superficie p-4"
        aria-label="Avance de la semana"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] text-tenue">Esta semana</span>
          <span className="text-[17px] font-bold tabular-nums">
            {hechosEntreno}
            <span className="text-[13px] font-semibold text-tenue"> / {entrenos.length} sesiones</span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5" aria-hidden="true">
          {DIAS.map((clave) => {
            const dia = semana.find((d) => d.dia === clave);
            const descanso = dia?.tipo === "descanso";
            return (
              <div
                key={clave}
                className={`h-1.5 rounded-full ${
                  estado.get(clave) === "hecho"
                    ? "bg-acento"
                    : estado.get(clave) === "en-curso"
                      ? "bg-acento/45"
                      : descanso
                        ? "bg-[#161c22]"
                        : "bg-[#222b35]"
                }`}
              />
            );
          })}
        </div>
      </section>

      <ul className="mt-5 grid gap-2">
        {semana.map((dia) => {
          const esHoy = dia.dia === hoy?.dia;
          const esDescanso = dia.tipo === "descanso";
          const estadoDia = estado.get(dia.dia);

          return (
            <li key={dia.dia}>
              <Link
                href={`/dia/${dia.dia}`}
                className={`flex items-center gap-[13px] rounded-[20px] border p-3.5 ${
                  esHoy ? "border-[#1c4056] bg-[#0d1620]" : "border-borde bg-superficie"
                }`}
              >
                <div className="w-8 shrink-0 text-center">
                  <p
                    className={`text-[11px] font-bold tracking-[1px] ${
                      esHoy ? "text-acento" : "text-apagado"
                    }`}
                  >
                    {ABREVIATURA[dia.dia]}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[15px] leading-tight font-bold ${
                      esDescanso ? "text-tenue" : ""
                    }`}
                  >
                    {dia.titulo}
                    {esHoy && <span className="sr-only"> (hoy)</span>}
                  </p>
                  <p className="mt-1 text-xs text-[#7b8794]">
                    {esDescanso
                      ? "Sin entrenamiento"
                      : `${dia.ejercicios.length} ejercicios · ${contarSeries(dia)} series`}
                  </p>
                </div>
                {estadoDia === "hecho" ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-acento">
                    <Icono nombre="check" className="size-4" grosor={2.6} />
                    Hecho
                  </span>
                ) : estadoDia === "en-curso" ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-acento-claro">
                    <span className="size-1.5 animate-latido rounded-full bg-acento" />
                    En curso
                  </span>
                ) : (
                  <Icono nombre="adelante" className="size-4 shrink-0 text-[#39434e]" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
