import datos from "@/data/rutina.json";
import type { DiaRutina, DiaSemana, Rutina } from "@/types/rutina";

/**
 * Única puerta de entrada a los datos de la rutina.
 * Hoy lee un JSON local; el día que haya base de datos (Supabase u otra),
 * solo cambian estas funciones y las pantallas siguen igual.
 */

const rutina = datos as Rutina;

/** Zona horaria fija: la app siempre razona en hora de Lima. */
export const ZONA_HORARIA = "America/Lima";

/** Orden de la semana tal como se muestra en la app. */
export const DIAS: readonly DiaSemana[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

/** Lo que devuelve Intl en inglés -> la clave que usa el JSON. */
const DIA_POR_NOMBRE_INGLES: Record<string, DiaSemana> = {
  Monday: "lunes",
  Tuesday: "martes",
  Wednesday: "miercoles",
  Thursday: "jueves",
  Friday: "viernes",
  Saturday: "sabado",
  Sunday: "domingo",
};

export function getRutina(): Rutina {
  return rutina;
}

export function getSemana(): DiaRutina[] {
  return rutina.semana;
}

export function getDia(dia: string): DiaRutina | undefined {
  return rutina.semana.find((d) => d.dia === dia);
}

export function esDiaSemana(valor: string): valor is DiaSemana {
  return (DIAS as readonly string[]).includes(valor);
}

/**
 * Día de la semana actual en America/Lima.
 * Se calcula con Intl para no depender de la zona horaria del dispositivo.
 */
export function getDiaDeHoy(fecha: Date = new Date()): DiaSemana {
  const nombre = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA,
    weekday: "long",
  }).format(fecha);

  return DIA_POR_NOMBRE_INGLES[nombre] ?? "lunes";
}

/** La sesión que toca hoy. */
export function getRutinaDeHoy(fecha: Date = new Date()): DiaRutina {
  const hoy = getDiaDeHoy(fecha);
  const dia = getDia(hoy);

  if (!dia) {
    throw new Error(`No hay datos para el día "${hoy}" en rutina.json`);
  }

  return dia;
}

/** Fecha de hoy en Lima, legible: "10 de septiembre". */
export function getFechaDeHoyTexto(fecha: Date = new Date()): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: ZONA_HORARIA,
    day: "numeric",
    month: "long",
  }).format(fecha);
}
