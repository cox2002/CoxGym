"use client";

import { useMemo } from "react";
import { crearAlmacen, useAlmacen } from "@/lib/almacen";
import {
  aplicarSesionRemota,
  claveSesion,
  FILA_VACIA,
  useSesiones,
  type SesionLocal,
  type SerieRegistro,
} from "@/lib/entreno";
import { leerNumero } from "@/lib/formato";
import { sumarDias } from "@/lib/fechas";
import { getDia, esDiaSemana } from "@/lib/rutina";
import {
  colaVacia,
  getVersionCola,
  sincronizar,
  tienePendientes,
  usePendientes,
} from "@/lib/sincronizacion";
import { getSupabase, type ClienteSupabase } from "@/lib/supabase";
import type { DiaSemana } from "@/types/rutina";

/**
 * Copia en el teléfono de todo lo registrado en la nube: sesiones, series,
 * peso corporal, medidas y fotos. Con ella se calculan los gráficos, también
 * sin conexión.
 */

export interface SesionHistorial {
  fecha: string;
  dia: DiaSemana;
  iniciada_en: string;
  terminada_en: string | null;
}

export interface SerieHistorial {
  fecha: string;
  dia: DiaSemana;
  ejercicio_id: string;
  orden: number;
  reps: number | null;
  peso_kg: number | null;
  rpe: number | null;
  completada: boolean;
}

export interface PesoHistorial {
  fecha: string;
  peso_kg: number;
}

export interface MedidaHistorial {
  fecha: string;
  zona: string;
  valor_cm: number;
}

export interface FotoHistorial {
  id: string;
  fecha: string;
  ruta: string;
}

export interface Historial {
  /** Momento de la última descarga completa; null si nunca se descargó. */
  descargadoEn: string | null;
  sesiones: SesionHistorial[];
  series: SerieHistorial[];
  pesos: PesoHistorial[];
  medidas: MedidaHistorial[];
  fotos: FotoHistorial[];
}

const VACIO: Historial = {
  descargadoEn: null,
  sesiones: [],
  series: [],
  pesos: [],
  medidas: [],
  fotos: [],
};

const almacenHistorial = crearAlmacen<Historial>("coxgym:historial:v1", VACIO);

export function useHistorialNube(): Historial {
  return useAlmacen(almacenHistorial);
}

/** Supabase devuelve como máximo 1000 filas por consulta: se pide por páginas. */
async function todas<T>(
  pedir: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const TAMANO = 1000;
  const filas: T[] = [];
  for (let desde = 0; ; desde += TAMANO) {
    const { data, error } = await pedir(desde, desde + TAMANO - 1);
    if (error) throw error;
    filas.push(...(data ?? []));
    if (!data || data.length < TAMANO) return filas;
  }
}

async function descargar(supabase: ClienteSupabase): Promise<Omit<Historial, "descargadoEn">> {
  const [sesiones, series, pesos, medidas, fotos] = await Promise.all([
    todas((desde, hasta) =>
      supabase
        .from("sesiones")
        .select("fecha, dia, iniciada_en, terminada_en")
        .order("fecha")
        .order("dia")
        .range(desde, hasta),
    ),
    todas((desde, hasta) =>
      supabase
        .from("series")
        .select("fecha, dia, ejercicio_id, orden, reps, peso_kg, rpe, completada")
        .order("fecha")
        .order("dia")
        .order("ejercicio_id")
        .order("orden")
        .range(desde, hasta),
    ),
    todas((desde, hasta) =>
      supabase.from("pesos_corporales").select("fecha, peso_kg").order("fecha").range(desde, hasta),
    ),
    todas((desde, hasta) =>
      supabase
        .from("medidas")
        .select("fecha, zona, valor_cm")
        .order("fecha")
        .order("zona")
        .range(desde, hasta),
    ),
    todas((desde, hasta) =>
      supabase.from("fotos_progreso").select("id, fecha, ruta").order("fecha").range(desde, hasta),
    ),
  ]);

  return {
    sesiones: sesiones.filter((s): s is SesionHistorial => esDiaSemana(s.dia)),
    series: series.filter((s): s is SerieHistorial => esDiaSemana(s.dia)),
    pesos,
    medidas,
    fotos,
  };
}

/** Convierte las filas de la nube al formato de la pantalla. */
function aSesionLocal(sesion: SesionHistorial, series: SerieHistorial[]): SesionLocal {
  const planDelDia = getDia(sesion.dia);
  const porEjercicio: Record<string, SerieRegistro[]> = {};

  for (const serie of series) {
    const planificadas =
      planDelDia?.ejercicios.find((e) => e.id === serie.ejercicio_id)?.series ?? 0;
    const filas = (porEjercicio[serie.ejercicio_id] ??= Array.from(
      { length: planificadas },
      () => FILA_VACIA,
    ));
    while (filas.length < serie.orden) filas.push(FILA_VACIA);
    filas[serie.orden - 1] = {
      reps: serie.reps === null ? "" : String(serie.reps),
      peso: serie.peso_kg === null ? "" : String(serie.peso_kg),
      rpe: serie.rpe === null ? "" : String(serie.rpe),
      hecha: serie.completada,
    };
  }

  return {
    fecha: sesion.fecha,
    dia: sesion.dia,
    iniciadaEn: sesion.iniciada_en,
    terminadaEn: sesion.terminada_en,
    series: porEjercicio,
  };
}

let descargando: Promise<"ok" | "sin-sesion" | "error"> | null = null;

/**
 * Descarga el historial completo. Primero sube lo pendiente para no traer
 * datos viejos, y luego actualiza en el teléfono las sesiones recientes.
 */
export function recargarHistorial(hoy: string): Promise<"ok" | "sin-sesion" | "error"> {
  descargando ??= (async () => {
    const supabase = getSupabase();
    if (!supabase) return "sin-sesion";
    const { data } = await supabase.auth.getSession();
    if (!data.session) return "sin-sesion";

    try {
      await sincronizar();
      // Si quedó algo sin subir (sin red), la nube no está al día con el teléfono.
      const colaLimpia = colaVacia();
      const version = getVersionCola();
      const descargado = await descargar(supabase);
      almacenHistorial.escribir({ ...descargado, descargadoEn: new Date().toISOString() });

      // Solo si nada cambió en el teléfono mientras se descargaba.
      if (colaLimpia && colaVacia() && getVersionCola() === version) {
        const desde = sumarDias(hoy, -7);
        const recientes = descargado.sesiones.filter((s) => s.fecha >= desde);
        for (const sesion of recientes) {
          const series = descargado.series.filter(
            (s) => s.fecha === sesion.fecha && s.dia === sesion.dia,
          );
          aplicarSesionRemota(sesion.fecha, sesion.dia, aSesionLocal(sesion, series));
        }
      }
      return "ok";
    } catch (error) {
      console.warn("[CoxGym] No se pudo descargar el historial:", error);
      return "error";
    } finally {
      descargando = null;
    }
  })();
  return descargando;
}

/** Al cerrar sesión: los datos de la cuenta no se quedan en el teléfono. */
export function olvidarHistorial() {
  almacenHistorial.escribir(VACIO);
}

/** Agrega al historial un peso recién registrado (antes de que suba). */
export function anotarPeso(fecha: string, pesoKg: number) {
  almacenHistorial.actualizar((h) => ({
    ...h,
    pesos: [...h.pesos.filter((p) => p.fecha !== fecha), { fecha, peso_kg: pesoKg }].sort(
      (a, b) => a.fecha.localeCompare(b.fecha),
    ),
  }));
}

export function anotarMedida(fecha: string, zona: string, valorCm: number) {
  almacenHistorial.actualizar((h) => ({
    ...h,
    medidas: [
      ...h.medidas.filter((m) => !(m.fecha === fecha && m.zona === zona)),
      { fecha, zona, valor_cm: valorCm },
    ].sort((a, b) => a.fecha.localeCompare(b.fecha)),
  }));
}

export function anotarFoto(foto: FotoHistorial) {
  almacenHistorial.actualizar((h) => ({
    ...h,
    fotos: [...h.fotos, foto].sort((a, b) => a.fecha.localeCompare(b.fecha)),
  }));
}

export function quitarFoto(id: string) {
  almacenHistorial.actualizar((h) => ({ ...h, fotos: h.fotos.filter((f) => f.id !== id) }));
}

export interface HistorialEntreno {
  sesiones: SesionHistorial[];
  /** Solo series completadas y con repeticiones. */
  series: SerieHistorial[];
}

/**
 * Nube + teléfono en una sola lista. Para cada sesión manda la copia del
 * teléfono si tiene cambios sin subir (o si nunca llegó a la nube).
 */
export function useHistorialEntreno(): HistorialEntreno {
  const nube = useHistorialNube();
  const locales = useSesiones();
  const pendientes = usePendientes();

  return useMemo(() => {
    const clavesNube = new Set(nube.sesiones.map((s) => claveSesion(s.fecha, s.dia)));
    const usarLocal = new Set(
      Object.values(locales)
        .filter((s) => !clavesNube.has(claveSesion(s.fecha, s.dia)) || tienePendientes(s.fecha, s.dia))
        .map((s) => claveSesion(s.fecha, s.dia)),
    );

    const sesiones: SesionHistorial[] = nube.sesiones.filter(
      (s) => !usarLocal.has(claveSesion(s.fecha, s.dia)),
    );
    const series: SerieHistorial[] = nube.series.filter(
      (s) => s.completada && s.reps !== null && !usarLocal.has(claveSesion(s.fecha, s.dia)),
    );

    for (const clave of usarLocal) {
      const local = locales[clave];
      sesiones.push({
        fecha: local.fecha,
        dia: local.dia,
        iniciada_en: local.iniciadaEn,
        terminada_en: local.terminadaEn,
      });
      for (const [ejercicioId, filas] of Object.entries(local.series)) {
        filas.forEach((fila, indice) => {
          const reps = leerNumero(fila.reps);
          if (!fila.hecha || reps === null) return;
          series.push({
            fecha: local.fecha,
            dia: local.dia,
            ejercicio_id: ejercicioId,
            orden: indice + 1,
            reps: Math.round(reps),
            peso_kg: leerNumero(fila.peso),
            rpe: leerNumero(fila.rpe),
            completada: true,
          });
        });
      }
    }

    sesiones.sort((a, b) => a.fecha.localeCompare(b.fecha));
    series.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.orden - b.orden);
    return { sesiones, series };
    // `pendientes` va en la lista: cuando la cola se vacía, manda la nube.
  }, [nube, locales, pendientes]);
}
