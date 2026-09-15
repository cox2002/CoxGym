"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import AnimacionEjercicio from "@/components/AnimacionEjercicio";
import Icono from "@/components/Icono";
import MapaCuerpo from "@/components/MapaCuerpo";
import TablaSeries, { type Sugerencia } from "@/components/TablaSeries";
import { iniciarDescanso } from "@/lib/descanso";
import { getInfoEjercicio } from "@/lib/ejercicios";
import {
  agregarSerie,
  editarSerie,
  filasDe,
  quitarUltimaSerie,
  terminarSesion,
  useSesion,
} from "@/lib/entreno";
import { ultimaVez } from "@/lib/estadisticas";
import { fechaCorta } from "@/lib/fechas";
import { duracionDescanso, numero } from "@/lib/formato";
import { useHistorialEntreno } from "@/lib/historial";
import { useHoy } from "@/lib/hoy";
import { NOMBRE_MUSCULO } from "@/lib/musculos";
import { useMantenerPantalla } from "@/lib/pantalla";
import type { DiaRutina } from "@/types/rutina";

interface Props {
  dia: DiaRutina;
  ejercicioId: string;
}

/** "8-10" → "8"; "al fallo" → "". */
function repsObjetivo(repeticiones: string): string {
  return repeticiones.match(/\d+/)?.[0] ?? "";
}

function Chip({ children, acento = false }: { children: ReactNode; acento?: boolean }) {
  return (
    <span
      className={`rounded-full border px-[11px] py-[5px] text-[11.5px] tabular-nums ${
        acento
          ? "border-acento-borde bg-acento-fondo font-bold text-acento-claro"
          : "border-borde-alto bg-superficie-alta font-semibold text-[#96a3b1]"
      }`}
    >
      {children}
    </span>
  );
}

/** Pantalla de un ejercicio durante la sesión: animación, series y técnica. */
export default function PantallaEjercicio({ dia, ejercicioId }: Props) {
  const router = useRouter();
  const hoy = useHoy();
  const historial = useHistorialEntreno();

  const indice = dia.ejercicios.findIndex((e) => e.id === ejercicioId);
  const ejercicio = dia.ejercicios[indice];
  const anteriorEj = dia.ejercicios[indice - 1];
  const siguienteEj = dia.ejercicios[indice + 1];
  const info = getInfoEjercicio(ejercicio.animacion);

  const sesion = useSesion(hoy?.fecha ?? null, dia.dia);
  const filas = filasDe(sesion, ejercicio.id, ejercicio.series);
  const previa = hoy ? ultimaVez(historial, ejercicio.id, hoy.fecha) : null;

  const [sello, setSello] = useState(false);
  useEffect(() => {
    if (!sello) return;
    const t = setTimeout(() => setSello(false), 800);
    return () => clearTimeout(t);
  }, [sello]);

  useMantenerPantalla(Boolean(sesion && !sesion.terminadaEn));

  const esHoy = hoy?.dia === dia.dia;
  const volverA = esHoy ? "/" : `/dia/${dia.dia}`;

  // Qué sugerir en cada fila: la misma serie de la última vez; si no hay, lo
  // escrito en la fila de arriba (hoy); si tampoco, el objetivo de la rutina.
  const sugerencias: Sugerencia[] = [];
  filas.forEach((_, i) => {
    const antes = previa?.series.find((s) => s.orden === i + 1);
    const arriba = filas[i - 1];
    const sugeridaArriba = sugerencias[i - 1];
    sugerencias.push({
      reps:
        antes?.reps != null
          ? String(antes.reps)
          : arriba?.reps || sugeridaArriba?.reps || repsObjetivo(ejercicio.repeticiones),
      peso: antes?.peso_kg
        ? numero(antes.peso_kg, 2)
        : arriba?.peso || sugeridaArriba?.peso || ejercicio.pesoSugerido.replace(/[^\d.,]/g, ""),
    });
  });

  function cambiar(i: number, campo: "reps" | "peso" | "rpe", valor: string) {
    if (!hoy) return;
    editarSerie(hoy.fecha, dia.dia, ejercicio.id, i, { [campo]: valor }, ejercicio.series);
  }

  function alternar(i: number) {
    if (!hoy) return;
    const fila = filas[i];
    if (fila.hecha) {
      editarSerie(hoy.fecha, dia.dia, ejercicio.id, i, { hecha: false }, ejercicio.series);
      return;
    }

    // Marcar sin escribir nada = repetir lo sugerido (la última vez o el objetivo).
    editarSerie(
      hoy.fecha,
      dia.dia,
      ejercicio.id,
      i,
      {
        hecha: true,
        reps: fila.reps || sugerencias[i].reps,
        peso: fila.peso || sugerencias[i].peso,
      },
      ejercicio.series,
    );

    const quedan = filas.filter((f, j) => j !== i && !f.hecha).length;
    if (quedan === 0) setSello(true);
    // Tras la última serie del último ejercicio ya no hay que descansar.
    if (quedan > 0 || siguienteEj) iniciarDescanso(ejercicio.descansoSeg);
  }

  function terminar() {
    if (!hoy) return;
    const algunaHecha = Object.values(sesion?.series ?? {}).some((f) => f.some((s) => s.hecha));
    if (!algunaHecha && !window.confirm("No marcaste ninguna serie. ¿Terminar la sesión igual?")) {
      return;
    }
    terminarSesion(hoy.fecha, dia.dia);
    router.push(`/dia/${dia.dia}/resumen`);
  }

  const completo = filas.every((f) => f.hecha);

  return (
    <div className="animate-entra px-[22px] pt-3.5">
      <div className="flex items-center justify-between">
        <Link
          href={volverA}
          className="inline-flex items-center gap-1.5 py-1 text-[13px] font-semibold text-tenue"
        >
          <Icono nombre="atras" className="size-[15px]" />
          {dia.nombreDia}
        </Link>

        <nav aria-label="Otros ejercicios del día" className="flex items-center gap-1">
          {anteriorEj ? (
            <Link
              href={`/dia/${dia.dia}/ejercicio/${anteriorEj.id}`}
              aria-label={`Anterior: ${anteriorEj.nombre}`}
              className="flex size-8 items-center justify-center rounded-lg text-tenue"
            >
              <Icono nombre="atras" className="size-4" />
            </Link>
          ) : (
            <span className="size-8" />
          )}
          <span className="text-xs font-bold text-apagado tabular-nums">
            {indice + 1} / {dia.ejercicios.length}
          </span>
          {siguienteEj ? (
            <Link
              href={`/dia/${dia.dia}/ejercicio/${siguienteEj.id}`}
              aria-label={`Siguiente: ${siguienteEj.nombre}`}
              className="flex size-8 items-center justify-center rounded-lg text-tenue"
            >
              <Icono nombre="adelante" className="size-4" />
            </Link>
          ) : (
            <span className="size-8" />
          )}
        </nav>
      </div>

      <div className="mt-2.5">
        <AnimacionEjercicio key={ejercicio.id} ejercicio={ejercicio} />
      </div>

      <h1 className="mt-[18px] text-[26px] leading-[1.15] font-extrabold tracking-[-0.5px] text-pretty">
        {ejercicio.nombre}
      </h1>

      <div className="mt-3.5 flex items-center gap-2.5">
        <MapaCuerpo
          activos={ejercicio.musculos.slice(0, 1)}
          secundarios={ejercicio.musculos.slice(1)}
          className="h-[100px] w-[74px] shrink-0"
        />
        <div className="flex flex-1 flex-wrap content-center gap-1.5">
          {ejercicio.musculos.map((m) => (
            <Chip key={m} acento>
              {NOMBRE_MUSCULO[m]}
            </Chip>
          ))}
          <Chip>
            {ejercicio.series} × {ejercicio.repeticiones}
          </Chip>
          <Chip>Descanso {duracionDescanso(ejercicio.descansoSeg)}</Chip>
          {info && <Chip>{info.equipo}</Chip>}
        </div>
      </div>

      <section className="mt-5" aria-label="Series">
        <p className="mb-2.5 min-h-[18px] text-[12.5px] text-tenue">
          {previa ? (
            <>
              <span className="font-bold text-suave">Última vez · {fechaCorta(previa.fecha)}: </span>
              <span className="tabular-nums">
                {previa.series
                  .map((s) => (s.peso_kg ? `${numero(s.peso_kg, 2)} × ${s.reps}` : `${s.reps} reps`))
                  .join(" · ")}
              </span>
            </>
          ) : (
            hoy && "Primera vez registrando este ejercicio."
          )}
        </p>

        <TablaSeries
          filas={filas}
          sugerencias={sugerencias}
          onCambiar={cambiar}
          onAlternar={alternar}
          onAgregar={() => hoy && agregarSerie(hoy.fecha, dia.dia, ejercicio.id, ejercicio.series)}
          onQuitar={() => hoy && quitarUltimaSerie(hoy.fecha, dia.dia, ejercicio.id, ejercicio.series)}
        />
      </section>

      {(ejercicio.notas || ejercicio.alternativa) && (
        <section className="mt-5 rounded-[18px] border border-borde bg-superficie px-4 py-[15px]">
          <h2 className="text-[10.5px] font-bold tracking-[1.4px] text-apagado uppercase">
            Cómo hacerlo
          </h2>
          {ejercicio.notas && (
            <p className="mt-2 text-[13px] leading-relaxed text-suave text-pretty">{ejercicio.notas}</p>
          )}
          {ejercicio.alternativa && (
            <p
              className={`text-[12.5px] leading-normal text-tenue ${
                ejercicio.notas ? "mt-3 border-t border-borde pt-3" : "mt-2"
              }`}
            >
              <span className="font-bold text-texto">Alternativa · </span>
              {ejercicio.alternativa}
            </p>
          )}
        </section>
      )}

      {info && info.pasos.length > 0 && (
        <details className="group mt-2 rounded-[18px] border border-borde bg-superficie px-4 py-[15px]">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[10.5px] font-bold tracking-[1.4px] text-apagado uppercase [&::-webkit-details-marker]:hidden">
            Paso a paso
            <Icono nombre="adelante" className="size-4 transition-transform group-open:rotate-90" />
          </summary>
          <ol className="mt-3 grid gap-2.5">
            {info.pasos.map((paso, i) => (
              <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-suave">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-superficie-alta text-[11px] font-bold text-tenue tabular-nums">
                  {i + 1}
                </span>
                <span className="text-pretty">{paso}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {siguienteEj ? (
        <Link
          href={`/dia/${dia.dia}/ejercicio/${siguienteEj.id}`}
          className={`mt-[18px] flex items-center justify-between gap-3 rounded-[18px] px-4 py-3.5 ${
            completo ? "bg-acento text-sobre-acento" : "border border-borde bg-superficie text-texto"
          }`}
        >
          <span className="min-w-0">
            <span
              className={`block text-[11px] font-bold tracking-[1.2px] uppercase ${
                completo ? "text-sobre-acento/70" : "text-apagado"
              }`}
            >
              Siguiente
            </span>
            <span className="block truncate text-[15px] font-extrabold">{siguienteEj.nombre}</span>
          </span>
          <Icono nombre="adelante" className="size-5 shrink-0" grosor={2.6} />
        </Link>
      ) : (
        <button
          type="button"
          onClick={terminar}
          disabled={!hoy}
          className={`mt-[18px] w-full rounded-[18px] p-4 text-center text-[15px] font-extrabold ${
            completo ? "bg-acento text-sobre-acento" : "border border-borde bg-superficie text-texto"
          }`}
        >
          Terminar sesión
        </button>
      )}

      {sello &&
        createPortal(
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(5,7,9,0.72)] backdrop-blur-[3px]"
          role="status"
        >
          <div className="flex size-24 animate-sello items-center justify-center rounded-full bg-acento text-sobre-acento">
            <Icono nombre="check" className="size-[46px]" grosor={2.8} />
          </div>
          <span className="sr-only">Ejercicio completado</span>
        </div>,
        document.body,
      )}
    </div>
  );
}
