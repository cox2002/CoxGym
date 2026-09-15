"use client";

import { useSyncExternalStore } from "react";

/**
 * Estado pequeño guardado en localStorage que varios componentes leen a la vez.
 * Sirve para que el entrenamiento siga funcionando sin conexión: la pantalla
 * escribe aquí al instante y la cola de sincronización lo sube después.
 */
export interface Almacen<T> {
  leer: () => T;
  escribir: (valor: T) => void;
  actualizar: (cambio: (actual: T) => T) => void;
  suscribir: (oyente: () => void) => () => void;
  inicial: T;
}

export function crearAlmacen<T>(clave: string, inicial: T): Almacen<T> {
  let valor: T | undefined;
  const oyentes = new Set<() => void>();

  function cargar(): T {
    try {
      const guardado = window.localStorage.getItem(clave);
      return guardado === null ? inicial : (JSON.parse(guardado) as T);
    } catch {
      return inicial;
    }
  }

  function leer(): T {
    if (typeof window === "undefined") return inicial;
    if (valor === undefined) valor = cargar();
    return valor;
  }

  function escribir(nuevo: T) {
    valor = nuevo;
    try {
      window.localStorage.setItem(clave, JSON.stringify(nuevo));
    } catch {
      // Sin espacio o almacenamiento bloqueado: al menos queda en memoria.
    }
    oyentes.forEach((oyente) => oyente());
  }

  function suscribir(oyente: () => void) {
    oyentes.add(oyente);

    // Otra pestaña con la app abierta cambió el mismo dato.
    const alCambiarEnOtraPestana = (evento: StorageEvent) => {
      if (evento.key !== clave) return;
      valor = cargar();
      oyente();
    };
    window.addEventListener("storage", alCambiarEnOtraPestana);

    return () => {
      oyentes.delete(oyente);
      window.removeEventListener("storage", alCambiarEnOtraPestana);
    };
  }

  return {
    leer,
    escribir,
    actualizar: (cambio) => escribir(cambio(leer())),
    suscribir,
    inicial,
  };
}

/** Lee un almacén y vuelve a renderizar cuando cambia. */
export function useAlmacen<T>(almacen: Almacen<T>): T {
  return useSyncExternalStore(almacen.suscribir, almacen.leer, () => almacen.inicial);
}

/** Estado solo en memoria (no se guarda): sesión de usuario, reloj, etc. */
export function crearEstado<T>(inicial: T): Almacen<T> {
  let valor = inicial;
  const oyentes = new Set<() => void>();

  function escribir(nuevo: T) {
    valor = nuevo;
    oyentes.forEach((oyente) => oyente());
  }

  return {
    leer: () => valor,
    escribir,
    actualizar: (cambio) => escribir(cambio(valor)),
    suscribir: (oyente) => {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    inicial,
  };
}
