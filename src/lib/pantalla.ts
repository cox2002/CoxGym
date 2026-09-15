"use client";

import { useEffect } from "react";

/**
 * Mantiene la pantalla encendida mientras `activo` sea true (entre series no
 * se apaga el teléfono). Si el navegador no lo soporta, no hace nada.
 */
export function useMantenerPantalla(activo: boolean) {
  useEffect(() => {
    if (!activo || !("wakeLock" in navigator)) return;

    let bloqueo: WakeLockSentinel | null = null;
    let cancelado = false;

    const pedir = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const nuevo = await navigator.wakeLock.request("screen");
        if (cancelado) void nuevo.release();
        else bloqueo = nuevo;
      } catch {
        // Batería baja o permiso denegado: la app sigue funcionando igual.
      }
    };

    // El navegador suelta el bloqueo al ocultar la pestaña: se pide de nuevo al volver.
    const alVolver = () => void pedir();
    void pedir();
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alVolver);
      void bloqueo?.release();
    };
  }, [activo]);
}
