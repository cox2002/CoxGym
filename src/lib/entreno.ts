"use client";

import { crearAlmacen, useAlmacen } from "@/lib/almacen";
import { leerNumero } from "@/lib/formato";
import { sumarDias } from "@/lib/fechas";
import { encolar, tienePendientes } from "@/lib/sincronizacion";
import type { DiaSemana } from "@/types/rutina";

/**
 * Sesiones de entrenamiento guardadas en el teléfono.
 * La pantalla lee y escribe aquí sin esperar a la red; cada cambio se encola
 * para Supabase (ver sincronizacion.ts).
 */

export interface SerieRegistro {
  /** Texto tal como se escribió, para no pelear con el teclado. */
  reps: string;
  peso: string;
  rpe: string;
  hecha: boolean;
}

export interface SesionLocal {
  fecha: string;
  dia: DiaSemana;
  iniciadaEn: string;
  terminadaEn: string | null;
  /** Filas por id de ejercicio; solo existen los ejercicios que se tocaron. */
  series: Record<string, SerieRegistro[]>;
}

type MapaSesiones = Record<string, SesionLocal>;

const almacenSesiones = crearAlmacen<MapaSesiones>("coxgym:sesiones:v1", {});

/** Las sesiones locales más viejas que esto se borran (ya viven en la nube). */
const DIAS_EN_TELEFONO = 60;

const MAX_SERIES = 20;

export const FILA_VACIA: SerieRegistro = { reps: "", peso: "", rpe: "", hecha: false };

export function claveSesion(fecha: string, dia: DiaSemana): string {
  return `${fecha}|${dia}`;
}

export function useSesiones(): MapaSesiones {
  return useAlmacen(almacenSesiones);
}

export function useSesion(fecha: string | null, dia: DiaSemana): SesionLocal | null {
  const sesiones = useSesiones();
  return fecha ? (sesiones[claveSesion(fecha, dia)] ?? null) : null;
}

function leerSesion(fecha: string, dia: DiaSemana): SesionLocal | undefined {
  return almacenSesiones.leer()[claveSesion(fecha, dia)];
}

function guardar(sesion: SesionLocal) {
  almacenSesiones.actualizar((mapa) => ({
    ...mapa,
    [claveSesion(sesion.fecha, sesion.dia)]: sesion,
  }));
}

/** Filas que ve la pantalla: las guardadas o, si no hay, las planificadas vacías. */
export function filasDe(
  sesion: SesionLocal | null,
  ejercicioId: string,
  planificadas: number,
): SerieRegistro[] {
  return (
    sesion?.series[ejercicioId] ??
    Array.from({ length: planificadas }, () => FILA_VACIA)
  );
}

function entre(valor: number | null, min: number, max: number): number | null {
  return valor !== null && valor >= min && valor <= max ? valor : null;
}

/** Texto de la pantalla → valores válidos para la base de datos. */
function aDatos(fila: SerieRegistro) {
  const reps = entre(leerNumero(fila.reps), 0, 500);
  const peso = entre(leerNumero(fila.peso), 0, 999.99);
  const rpe = entre(leerNumero(fila.rpe), 1, 10);
  return {
    reps: reps === null ? null : Math.round(reps),
    peso_kg: peso === null ? null : Math.round(peso * 100) / 100,
    rpe: rpe === null ? null : Math.round(rpe * 2) / 2,
    completada: fila.hecha,
  };
}

function estaVacia(fila: SerieRegistro): boolean {
  return !fila.hecha && !fila.reps.trim() && !fila.peso.trim() && !fila.rpe.trim();
}

export function iniciarSesion(fecha: string, dia: DiaSemana): SesionLocal {
  const existente = leerSesion(fecha, dia);
  if (existente) return existente;

  const nueva: SesionLocal = {
    fecha,
    dia,
    iniciadaEn: new Date().toISOString(),
    terminadaEn: null,
    series: {},
  };
  guardar(nueva);
  encolar({ tipo: "sesion", fecha, dia, datos: { iniciada_en: nueva.iniciadaEn } });
  return nueva;
}

/** Cambia una fila (índice desde 0). Empieza la sesión si aún no existía. */
export function editarSerie(
  fecha: string,
  dia: DiaSemana,
  ejercicioId: string,
  indice: number,
  cambios: Partial<SerieRegistro>,
  planificadas: number,
) {
  const sesion = iniciarSesion(fecha, dia);
  const filas = filasDe(sesion, ejercicioId, planificadas).slice();
  while (filas.length <= indice) filas.push(FILA_VACIA);

  const fila = { ...filas[indice], ...cambios };
  filas[indice] = fila;
  guardar({ ...sesion, series: { ...sesion.series, [ejercicioId]: filas } });

  const orden = indice + 1;
  if (estaVacia(fila)) {
    encolar({ tipo: "borrar-serie", fecha, dia, ejercicioId, orden });
  } else {
    encolar({ tipo: "serie", fecha, dia, ejercicioId, orden, datos: aDatos(fila) });
  }
}

export function agregarSerie(
  fecha: string,
  dia: DiaSemana,
  ejercicioId: string,
  planificadas: number,
) {
  const sesion = iniciarSesion(fecha, dia);
  const filas = filasDe(sesion, ejercicioId, planificadas);
  if (filas.length >= MAX_SERIES) return;
  // La fila nueva no se sube hasta que tenga algún dato.
  guardar({ ...sesion, series: { ...sesion.series, [ejercicioId]: [...filas, FILA_VACIA] } });
}

export function quitarUltimaSerie(
  fecha: string,
  dia: DiaSemana,
  ejercicioId: string,
  planificadas: number,
) {
  const sesion = iniciarSesion(fecha, dia);
  const filas = filasDe(sesion, ejercicioId, planificadas);
  if (filas.length <= 1) return;

  guardar({ ...sesion, series: { ...sesion.series, [ejercicioId]: filas.slice(0, -1) } });
  encolar({ tipo: "borrar-serie", fecha, dia, ejercicioId, orden: filas.length });
}

export function terminarSesion(fecha: string, dia: DiaSemana) {
  const sesion = iniciarSesion(fecha, dia);
  const terminadaEn = new Date().toISOString();
  guardar({ ...sesion, terminadaEn });
  encolar({ tipo: "sesion", fecha, dia, datos: { terminada_en: terminadaEn } });
}

/** Seguir entrenando después de haber terminado. */
export function reabrirSesion(fecha: string, dia: DiaSemana) {
  const sesion = leerSesion(fecha, dia);
  if (!sesion?.terminadaEn) return;
  guardar({ ...sesion, terminadaEn: null });
  encolar({ tipo: "sesion", fecha, dia, datos: { terminada_en: null } });
}

/** Borra la sesión (por ejemplo, si se empezó por error). */
export function descartarSesion(fecha: string, dia: DiaSemana) {
  const clave = claveSesion(fecha, dia);
  almacenSesiones.actualizar((mapa) => {
    const copia = { ...mapa };
    delete copia[clave];
    return copia;
  });
  encolar({ tipo: "borrar-sesion", fecha, dia });
}

/**
 * Trae a este teléfono lo que está en la nube para una sesión (por ejemplo,
 * registrada desde otro dispositivo). Si hay cambios locales sin subir, ganan
 * los locales: la cola los subirá enseguida.
 */
export function aplicarSesionRemota(
  fecha: string,
  dia: DiaSemana,
  remota: SesionLocal | null,
) {
  if (tienePendientes(fecha, dia)) return;
  const clave = claveSesion(fecha, dia);

  almacenSesiones.actualizar((mapa) => {
    if (!remota) {
      if (!mapa[clave]) return mapa;
      const copia = { ...mapa };
      delete copia[clave];
      return copia;
    }
    if (JSON.stringify(mapa[clave]) === JSON.stringify(remota)) return mapa;
    return { ...mapa, [clave]: remota };
  });
}

/** Libera espacio: borra del teléfono las sesiones de hace más de 60 días. */
export function podarSesionesAntiguas(hoy: string) {
  const limite = sumarDias(hoy, -DIAS_EN_TELEFONO);
  almacenSesiones.actualizar((mapa) => {
    const viejas = Object.keys(mapa).filter((clave) => mapa[clave].fecha < limite);
    if (viejas.length === 0) return mapa;
    const copia = { ...mapa };
    for (const clave of viejas) delete copia[clave];
    return copia;
  });
}

/** Ejercicio con todas sus filas marcadas como hechas. */
export function ejercicioCompleto(
  sesion: SesionLocal | null,
  ejercicioId: string,
  planificadas: number,
): boolean {
  const filas = filasDe(sesion, ejercicioId, planificadas);
  return filas.length > 0 && filas.every((fila) => fila.hecha);
}
