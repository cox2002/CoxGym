import { diasEntre, inicioSemana, sumarDias } from "@/lib/fechas";
import { leerNumero } from "@/lib/formato";
import { getEjercicioPorId } from "@/lib/rutina";
import type { HistorialEntreno, SerieHistorial } from "@/lib/historial";
import type { SesionLocal } from "@/lib/entreno";
import type { DiaRutina, Musculo } from "@/types/rutina";

/**
 * Cálculos de progreso. Funciones puras: reciben el historial y devuelven
 * números listos para mostrar.
 */

/** 1RM estimado (fórmula de Epley). Sirve para comparar series con distinto peso y reps. */
export function e1rm(pesoKg: number, reps: number): number {
  if (pesoKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return pesoKg;
  return pesoKg * (1 + reps / 30);
}

function volumen(serie: SerieHistorial): number {
  return (serie.peso_kg ?? 0) * (serie.reps ?? 0);
}

export interface Semana {
  /** Lunes de la semana. */
  inicio: string;
  volumenKg: number;
  series: number;
  sesiones: number;
}

/** Las últimas `cuantas` semanas (la actual al final), aunque estén vacías. */
export function semanas(historial: HistorialEntreno, hoy: string, cuantas: number): Semana[] {
  const actual = inicioSemana(hoy);
  const lista: Semana[] = Array.from({ length: cuantas }, (_, i) => ({
    inicio: sumarDias(actual, -7 * (cuantas - 1 - i)),
    volumenKg: 0,
    series: 0,
    sesiones: 0,
  }));
  const porInicio = new Map(lista.map((s) => [s.inicio, s]));
  const conSeries = new Set<string>();

  for (const serie of historial.series) {
    const semana = porInicio.get(inicioSemana(serie.fecha));
    if (!semana) continue;
    semana.volumenKg += volumen(serie);
    semana.series += 1;
    conSeries.add(`${serie.fecha}|${serie.dia}`);
  }
  for (const clave of conSeries) {
    const semana = porInicio.get(inicioSemana(clave.split("|")[0]));
    if (semana) semana.sesiones += 1;
  }
  return lista;
}

/**
 * Semanas seguidas con al menos un entrenamiento. La semana en curso suma si
 * ya tiene uno; si todavía no, no rompe la racha.
 */
export function rachaSemanas(historial: HistorialEntreno, hoy: string): number {
  const entrenadas = new Set(historial.series.map((s) => inicioSemana(s.fecha)));
  let semana = inicioSemana(hoy);
  if (!entrenadas.has(semana)) semana = sumarDias(semana, -7);

  let racha = 0;
  while (entrenadas.has(semana)) {
    racha += 1;
    semana = sumarDias(semana, -7);
  }
  return racha;
}

export interface RecordPersonal {
  ejercicioId: string;
  pesoKg: number;
  reps: number;
  e1rm: number;
  fecha: string;
}

/** Mejor serie (por 1RM estimado) de cada ejercicio con peso; los más recientes primero. */
export function recordsPersonales(series: SerieHistorial[]): RecordPersonal[] {
  const mejores = new Map<string, RecordPersonal>();
  for (const serie of series) {
    const peso = serie.peso_kg ?? 0;
    const reps = serie.reps ?? 0;
    const estimado = e1rm(peso, reps);
    if (estimado === 0) continue;
    const previo = mejores.get(serie.ejercicio_id);
    if (!previo || estimado > previo.e1rm) {
      mejores.set(serie.ejercicio_id, {
        ejercicioId: serie.ejercicio_id,
        pesoKg: peso,
        reps,
        e1rm: estimado,
        fecha: serie.fecha,
      });
    }
  }
  return [...mejores.values()].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || b.e1rm - a.e1rm,
  );
}

export interface PuntoEjercicio {
  fecha: string;
  /** 1RM estimado de la mejor serie del día (0 si es sin peso). */
  e1rm: number;
  /** Serie más pesada del día. */
  pesoKg: number;
  reps: number;
  /** Repeticiones de la mejor serie: la métrica de los ejercicios sin peso. */
  repsMax: number;
}

export function progresoEjercicio(series: SerieHistorial[], ejercicioId: string): PuntoEjercicio[] {
  const porFecha = new Map<string, PuntoEjercicio>();
  for (const serie of series) {
    if (serie.ejercicio_id !== ejercicioId) continue;
    const peso = serie.peso_kg ?? 0;
    const reps = serie.reps ?? 0;
    const punto = porFecha.get(serie.fecha) ?? {
      fecha: serie.fecha,
      e1rm: 0,
      pesoKg: 0,
      reps: 0,
      repsMax: 0,
    };
    punto.e1rm = Math.max(punto.e1rm, e1rm(peso, reps));
    if (peso > punto.pesoKg || (peso === punto.pesoKg && reps > punto.reps)) {
      punto.pesoKg = peso;
      punto.reps = reps;
    }
    punto.repsMax = Math.max(punto.repsMax, reps);
    porFecha.set(serie.fecha, punto);
  }
  return [...porFecha.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/**
 * Series por músculo entre dos fechas (incluidas). El músculo principal del
 * ejercicio suma 1 y los secundarios 0,5, como se cuenta el volumen semanal.
 */
export function seriesPorMusculo(
  series: SerieHistorial[],
  desde: string,
  hasta: string,
): Partial<Record<Musculo, number>> {
  const conteo: Partial<Record<Musculo, number>> = {};
  for (const serie of series) {
    if (serie.fecha < desde || serie.fecha > hasta) continue;
    const musculos = getEjercicioPorId(serie.ejercicio_id)?.musculos ?? [];
    musculos.forEach((musculo, indice) => {
      conteo[musculo] = (conteo[musculo] ?? 0) + (indice === 0 ? 1 : 0.5);
    });
  }
  return conteo;
}

export interface ResumenSesion {
  duracionSeg: number;
  ejerciciosCompletos: number;
  seriesHechas: number;
  volumenKg: number;
}

export function resumirSesion(sesion: SesionLocal, dia: DiaRutina): ResumenSesion {
  let seriesHechas = 0;
  let volumenKg = 0;
  let ejerciciosCompletos = 0;

  for (const ejercicio of dia.ejercicios) {
    const filas = sesion.series[ejercicio.id] ?? [];
    const hechas = filas.filter((f) => f.hecha);
    seriesHechas += hechas.length;
    for (const fila of hechas) {
      volumenKg += (leerNumero(fila.peso) ?? 0) * (leerNumero(fila.reps) ?? 0);
    }
    if (filas.length > 0 && hechas.length === filas.length) ejerciciosCompletos += 1;
  }

  const fin = sesion.terminadaEn ? Date.parse(sesion.terminadaEn) : Date.now();
  return {
    duracionSeg: Math.max(0, (fin - Date.parse(sesion.iniciadaEn)) / 1000),
    ejerciciosCompletos,
    seriesHechas,
    volumenKg,
  };
}

/** Récords batidos en una sesión frente a todo lo anterior a su fecha. */
export function recordsDeLaSesion(
  historial: HistorialEntreno,
  fecha: string,
  dia: string,
): RecordPersonal[] {
  const previas = historial.series.filter((s) => s.fecha < fecha);
  const mejoresPrevios = new Map(recordsPersonales(previas).map((r) => [r.ejercicioId, r.e1rm]));
  const deHoy = recordsPersonales(
    historial.series.filter((s) => s.fecha === fecha && s.dia === dia),
  );
  return deHoy.filter((r) => {
    const previo = mejoresPrevios.get(r.ejercicioId);
    return previo !== undefined && r.e1rm > previo + 0.01;
  });
}

/** Series completadas la última vez que se hizo el ejercicio antes de `antesDe`. */
export function ultimaVez(
  historial: HistorialEntreno,
  ejercicioId: string,
  antesDe: string,
): { fecha: string; series: SerieHistorial[] } | null {
  let fecha: string | null = null;
  for (const serie of historial.series) {
    if (serie.ejercicio_id === ejercicioId && serie.fecha < antesDe) {
      if (fecha === null || serie.fecha > fecha) fecha = serie.fecha;
    }
  }
  if (fecha === null) return null;
  return {
    fecha,
    series: historial.series.filter((s) => s.ejercicio_id === ejercicioId && s.fecha === fecha),
  };
}

/** Última entrada y la diferencia con la primera de los últimos `dias` días. */
export function tendencia<T extends { fecha: string }>(
  entradas: T[],
  valor: (entrada: T) => number,
  hoy: string,
  dias: number,
): { actual: T | null; cambio: number | null } {
  const actual = entradas[entradas.length - 1] ?? null;
  const ventana = entradas.filter((e) => diasEntre(e.fecha, hoy) <= dias);
  if (!actual || ventana.length < 2) return { actual, cambio: null };
  return { actual, cambio: valor(actual) - valor(ventana[0]) };
}
