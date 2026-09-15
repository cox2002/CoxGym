"use client";

import { crearAlmacen, crearEstado, useAlmacen } from "@/lib/almacen";
import { getSupabase, type ClienteSupabase } from "@/lib/supabase";
import type { DiaSemana } from "@/types/rutina";

/**
 * Cola de cambios pendientes de subir a Supabase.
 *
 * En el gimnasio la señal va y viene: cada cambio se guarda primero en el
 * teléfono y entra a esta cola, que se vacía en orden cuando hay conexión y
 * sesión iniciada. Todas las operaciones usan claves naturales (fecha, día,
 * ejercicio, número de serie), así que reenviar una operación no duplica nada.
 */

interface DatosSesion {
  iniciada_en?: string;
  terminada_en?: string | null;
}

interface DatosSerie {
  reps: number | null;
  peso_kg: number | null;
  rpe: number | null;
  completada: boolean;
}

export type Operacion =
  | { tipo: "sesion"; fecha: string; dia: DiaSemana; datos: DatosSesion }
  | { tipo: "borrar-sesion"; fecha: string; dia: DiaSemana }
  | {
      tipo: "serie";
      fecha: string;
      dia: DiaSemana;
      ejercicioId: string;
      orden: number;
      datos: DatosSerie;
    }
  | { tipo: "borrar-serie"; fecha: string; dia: DiaSemana; ejercicioId: string; orden: number }
  | { tipo: "peso"; fecha: string; pesoKg: number }
  | { tipo: "borrar-peso"; fecha: string }
  | { tipo: "medida"; fecha: string; zona: string; valorCm: number };

const almacenCola = crearAlmacen<Operacion[]>("coxgym:cola:v1", []);

interface EstadoSincronizacion {
  sincronizando: boolean;
  /** Mensaje del último fallo de red, si lo hubo. */
  errorRed: string | null;
  /** Operaciones que la base de datos rechazó y se descartaron. */
  rechazadas: number;
}

const almacenEstado = crearEstado<EstadoSincronizacion>({
  sincronizando: false,
  errorRed: null,
  rechazadas: 0,
});

/** Dos operaciones con la misma clave tocan la misma fila. */
function claveDe(op: Operacion): string {
  switch (op.tipo) {
    case "sesion":
    case "borrar-sesion":
      return `sesion|${op.fecha}|${op.dia}`;
    case "serie":
    case "borrar-serie":
      return `serie|${op.fecha}|${op.dia}|${op.ejercicioId}|${op.orden}`;
    case "peso":
    case "borrar-peso":
      return `peso|${op.fecha}`;
    case "medida":
      return `medida|${op.fecha}|${op.zona}`;
  }
}

let versionCola = 0;

/**
 * Crece con cada cambio encolado. Quien descarga datos de la nube la compara
 * antes y después: si cambió, lo descargado puede estar desactualizado.
 */
export function getVersionCola(): number {
  return versionCola;
}

export function colaVacia(): boolean {
  return almacenCola.leer().length === 0;
}

/** Agrega un cambio a la cola, fusionándolo con uno pendiente de la misma fila. */
export function encolar(op: Operacion) {
  versionCola++;
  almacenCola.actualizar((cola) => {
    let nueva = cola;

    // Borrar una sesión arrastra sus series pendientes.
    if (op.tipo === "borrar-sesion") {
      const prefijo = `serie|${op.fecha}|${op.dia}|`;
      nueva = nueva.filter((o) => !claveDe(o).startsWith(prefijo));
    }

    const clave = claveDe(op);
    let indice = -1;
    for (let i = nueva.length - 1; i >= 0; i--) {
      if (claveDe(nueva[i]) === clave) {
        indice = i;
        break;
      }
    }
    if (indice === -1) return [...nueva, op];

    const previa = nueva[indice];

    // Sesión borrada y vuelta a empezar: el borrado tiene que subir primero.
    if (previa.tipo === "borrar-sesion" && op.tipo === "sesion") {
      return [...nueva, op];
    }

    const fusionada: Operacion =
      previa.tipo === "sesion" && op.tipo === "sesion"
        ? { ...op, datos: { ...previa.datos, ...op.datos } }
        : op;

    // Se conserva la posición: la sesión siempre sube antes que sus series.
    const copia = nueva.slice();
    copia[indice] = fusionada;
    return copia;
  });
  programarSincronizacion();
}

type Resultado = "ok" | "reintentar" | "rechazada";

async function ejecutar(
  supabase: ClienteSupabase,
  userId: string,
  op: Operacion,
): Promise<Resultado> {
  const consulta = (() => {
    switch (op.tipo) {
      case "sesion":
        return supabase
          .from("sesiones")
          .upsert(
            { user_id: userId, fecha: op.fecha, dia: op.dia, ...op.datos },
            { onConflict: "user_id,fecha,dia" },
          );
      case "borrar-sesion":
        return supabase
          .from("sesiones")
          .delete()
          .match({ user_id: userId, fecha: op.fecha, dia: op.dia });
      case "serie":
        return supabase.from("series").upsert(
          {
            user_id: userId,
            fecha: op.fecha,
            dia: op.dia,
            ejercicio_id: op.ejercicioId,
            orden: op.orden,
            ...op.datos,
          },
          { onConflict: "user_id,fecha,dia,ejercicio_id,orden" },
        );
      case "borrar-serie":
        return supabase.from("series").delete().match({
          user_id: userId,
          fecha: op.fecha,
          dia: op.dia,
          ejercicio_id: op.ejercicioId,
          orden: op.orden,
        });
      case "peso":
        return supabase
          .from("pesos_corporales")
          .upsert(
            { user_id: userId, fecha: op.fecha, peso_kg: op.pesoKg },
            { onConflict: "user_id,fecha" },
          );
      case "borrar-peso":
        return supabase
          .from("pesos_corporales")
          .delete()
          .match({ user_id: userId, fecha: op.fecha });
      case "medida":
        return supabase
          .from("medidas")
          .upsert(
            { user_id: userId, fecha: op.fecha, zona: op.zona, valor_cm: op.valorCm },
            { onConflict: "user_id,fecha,zona" },
          );
    }
  })();

  const { error, status } = await consulta;
  if (!error) return "ok";

  // Sin red (status 0), servidor caído o pausado, token vencido o límite de
  // peticiones: se reintenta más tarde sin perder el cambio.
  if (status === 0 || status === 401 || status === 408 || status === 429 || status >= 500) {
    almacenEstado.actualizar((e) => ({ ...e, errorRed: error.message }));
    return "reintentar";
  }

  console.warn("[CoxGym] Cambio rechazado por la base de datos:", op, error);
  return "rechazada";
}

let enCurso: Promise<void> | null = null;

/**
 * Sube la cola en orden y se detiene al primer fallo de red. Si ya hay una
 * subida en marcha devuelve esa misma promesa: quien espera, espera de verdad.
 */
export function sincronizar(): Promise<void> {
  enCurso ??= subirCola().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

async function subirCola(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || almacenCola.leer().length === 0) return;

  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;

  almacenEstado.actualizar((e) => ({ ...e, sincronizando: true }));

  try {
    for (;;) {
      const op = almacenCola.leer()[0];
      if (!op) {
        almacenEstado.actualizar((e) => ({ ...e, errorRed: null }));
        break;
      }

      const resultado = await ejecutar(supabase, userId, op);
      if (resultado === "reintentar") break;
      if (resultado === "rechazada") {
        almacenEstado.actualizar((e) => ({ ...e, rechazadas: e.rechazadas + 1 }));
      }

      // Si mientras subía llegó un cambio nuevo para la misma fila, la
      // operación fue reemplazada en su lugar y se sube en la siguiente vuelta.
      almacenCola.actualizar((cola) => (cola[0] === op ? cola.slice(1) : cola));
    }
  } finally {
    almacenEstado.actualizar((e) => ({ ...e, sincronizando: false }));
  }
}

let temporizador: ReturnType<typeof setTimeout> | undefined;

/** Agrupa varios cambios seguidos en una sola subida. */
export function programarSincronizacion(esperaMs = 600) {
  if (typeof window === "undefined") return;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => void sincronizar(), esperaMs);
}

/** ¿Hay cambios sin subir para esta sesión? */
export function tienePendientes(fecha: string, dia: DiaSemana): boolean {
  const prefijos = [`sesion|${fecha}|${dia}`, `serie|${fecha}|${dia}|`];
  return almacenCola
    .leer()
    .some((op) => prefijos.some((p) => claveDe(op).startsWith(p)));
}

export function usePendientes(): number {
  return useAlmacen(almacenCola).length;
}

export function useEstadoSincronizacion(): EstadoSincronizacion {
  return useAlmacen(almacenEstado);
}
