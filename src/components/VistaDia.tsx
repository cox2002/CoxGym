"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import EncabezadoDia from "@/components/EncabezadoDia";
import Icono from "@/components/Icono";
import MapaCuerpo from "@/components/MapaCuerpo";
import MiniaturaEjercicio from "@/components/MiniaturaEjercicio";
import NotaDia from "@/components/NotaDia";
import TarjetaDescanso from "@/components/TarjetaDescanso";
import { useAhora } from "@/lib/ahora";
import {
  descartarSesion,
  ejercicioCompleto,
  filasDe,
  iniciarSesion,
  terminarSesion,
  useSesion,
} from "@/lib/entreno";
import { reloj } from "@/lib/fechas";
import { duracionDescanso } from "@/lib/formato";
import { useHoy } from "@/lib/hoy";
import { musculosDelDia } from "@/lib/musculos";
import { contarSeries, duracionEstimadaMin, getFechaDeHoyTexto } from "@/lib/rutina";
import type { DiaRutina } from "@/types/rutina";

interface Props {
  dia: DiaRutina;
  /** Muestra el enlace "Semana" arriba (la vista de un día concreto). */
  conVolver?: boolean;
}

function Dato({ etiqueta, valor, resaltado }: { etiqueta: string; valor: string; resaltado?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[12.5px] text-tenue">{etiqueta}</span>
      <span className={`text-[17px] font-bold tabular-nums ${resaltado ? "text-acento" : ""}`}>
        {valor}
      </span>
    </div>
  );
}

/** Sesión completa de un día. La usan "/" (hoy) y "/dia/[dia]". */
export default function VistaDia({ dia, conVolver = false }: Props) {
  const router = useRouter();
  const hoy = useHoy();
  const sesion = useSesion(hoy?.fecha ?? null, dia.dia);
  const enCurso = Boolean(sesion && !sesion.terminadaEn);
  const ahora = useAhora(enCurso);

  const esHoy = hoy?.dia === dia.dia;
  const esDescanso = dia.tipo === "descanso";
  const completos = dia.ejercicios.filter((e) => ejercicioCompleto(sesion, e.id, e.series)).length;
  const todosCompletos = dia.ejercicios.length > 0 && completos === dia.ejercicios.length;
  const transcurrido = sesion ? (ahora - Date.parse(sesion.iniciadaEn)) / 1000 : 0;

  const sobretitulo = !hoy
    ? ""
    : esHoy
      ? `Hoy · ${getFechaDeHoyTexto()}`
      : dia.nombreDia;

  const rutaEjercicio = (id: string) => `/dia/${dia.dia}/ejercicio/${id}`;

  function accionPrincipal() {
    if (!hoy || dia.ejercicios.length === 0) return;
    if (sesion?.terminadaEn) {
      router.push(`/dia/${dia.dia}/resumen`);
      return;
    }
    if (sesion && todosCompletos) {
      terminarSesion(hoy.fecha, dia.dia);
      router.push(`/dia/${dia.dia}/resumen`);
      return;
    }
    iniciarSesion(hoy.fecha, dia.dia);
    const pendiente =
      dia.ejercicios.find((e) => !ejercicioCompleto(sesion, e.id, e.series)) ?? dia.ejercicios[0];
    router.push(rutaEjercicio(pendiente.id));
  }

  function descartar() {
    if (!hoy) return;
    if (window.confirm("¿Descartar la sesión de hoy? Se borran las series registradas.")) {
      descartarSesion(hoy.fecha, dia.dia);
    }
  }

  const textoBoton = sesion?.terminadaEn
    ? "Ver resumen"
    : sesion && todosCompletos
      ? "Terminar sesión"
      : sesion
        ? `Continuar entrenamiento · ${reloj(transcurrido)}`
        : "Empezar entrenamiento";

  return (
    <div className="animate-entra px-[22px] pt-3.5">
      {conVolver && (
        <Link
          href="/semana"
          className="mb-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-tenue"
        >
          <Icono nombre="atras" className="size-[15px]" />
          Semana
        </Link>
      )}

      <EncabezadoDia dia={dia} sobretitulo={sobretitulo} />

      {!esDescanso && (
        <section className="mt-[18px] flex items-center gap-3.5 rounded-[22px] border border-borde bg-superficie p-4">
          <MapaCuerpo activos={musculosDelDia(dia)} className="h-[132px] w-24 shrink-0" />
          <div className="grid flex-1 gap-2.5">
            <Dato etiqueta="Ejercicios" valor={String(dia.ejercicios.length)} />
            <div className="h-px bg-borde" />
            <Dato etiqueta="Series" valor={String(contarSeries(dia))} />
            <div className="h-px bg-borde" />
            <Dato etiqueta="Duración" valor={`${duracionEstimadaMin(dia)} min`} />
            <div className="h-px bg-borde" />
            <Dato
              etiqueta="Completado"
              valor={`${completos}/${dia.ejercicios.length}`}
              resaltado={todosCompletos}
            />
          </div>
        </section>
      )}

      {dia.notas && !esDescanso && (
        <div className="mt-3.5">
          <NotaDia texto={dia.notas} />
        </div>
      )}

      {esDescanso && (
        <div className="mt-5">
          <TarjetaDescanso dia={dia} />
        </div>
      )}

      {dia.ejercicios.length > 0 && (
        <>
          <div className="mt-[22px] flex items-center justify-between">
            <h2 className="text-[11px] font-bold tracking-[1.6px] text-apagado uppercase">
              Ejercicios
            </h2>
            {enCurso && (
              <span className="text-[12.5px] font-bold text-acento tabular-nums">
                {reloj(transcurrido)}
              </span>
            )}
          </div>

          <ol className="mt-3 grid gap-2">
            {dia.ejercicios.map((ejercicio, indice) => {
              const filas = filasDe(sesion, ejercicio.id, ejercicio.series);
              const hechas = filas.filter((f) => f.hecha).length;
              const completo = hechas === filas.length;
              return (
                <li key={ejercicio.id}>
                  <Link
                    href={rutaEjercicio(ejercicio.id)}
                    className={`flex items-center gap-3 rounded-[18px] border p-2.5 pr-3.5 ${
                      completo ? "border-acento-borde bg-[#0d1418]" : "border-borde bg-superficie"
                    }`}
                  >
                    <div className="relative">
                      <MiniaturaEjercicio ejercicio={ejercicio} />
                      <span className="absolute -top-1.5 -left-1.5 flex size-[22px] items-center justify-center rounded-lg border border-borde bg-fondo text-[11px] font-bold text-tenue tabular-nums">
                        {indice + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[14.5px] leading-tight font-semibold text-pretty ${
                          completo ? "text-tenue" : ""
                        }`}
                      >
                        {ejercicio.nombre}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#7b8794] tabular-nums">
                        {ejercicio.series} series · {ejercicio.repeticiones} reps ·{" "}
                        {duracionDescanso(ejercicio.descansoSeg)}
                        {hechas > 0 && !completo && (
                          <span className="text-acento"> · {hechas}/{filas.length} hechas</span>
                        )}
                      </p>
                    </div>
                    {completo ? (
                      <Icono nombre="check" className="size-[19px] text-acento" grosor={2.4} />
                    ) : (
                      <Icono nombre="adelante" className="size-[17px] text-[#3a4550]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>

          {dia.cardio && (
            <p className="mt-3 rounded-2xl border border-borde bg-superficie px-3.5 py-3 text-[13px] text-tenue">
              <span className="font-bold text-texto">Cardio · </span>
              {dia.cardio}
            </p>
          )}

          <button
            type="button"
            onClick={accionPrincipal}
            disabled={!hoy}
            className={`mt-5 w-full rounded-[18px] p-4 text-center text-[15px] font-extrabold tracking-[0.2px] tabular-nums disabled:opacity-60 ${
              sesion?.terminadaEn
                ? "border border-borde bg-superficie text-suave"
                : "bg-acento text-sobre-acento"
            }`}
          >
            {textoBoton}
          </button>

          {enCurso && (
            <button
              type="button"
              onClick={descartar}
              className="mx-auto mt-3 block px-3 py-2 text-[12.5px] font-semibold text-apagado"
            >
              Descartar sesión
            </button>
          )}
        </>
      )}
    </div>
  );
}
