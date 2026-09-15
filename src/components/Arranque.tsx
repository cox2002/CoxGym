"use client";

import { useEffect, useRef } from "react";
import { escucharCuenta, useCuenta } from "@/lib/cuenta";
import { podarSesionesAntiguas } from "@/lib/entreno";
import { recargarHistorial } from "@/lib/historial";
import { getFechaISOHoy } from "@/lib/rutina";
import { sincronizar } from "@/lib/sincronizacion";

/** Cada cuánto, como mínimo, se vuelve a descargar el historial al volver a la app. */
const REFRESCO_HISTORIAL_MS = 5 * 60_000;

/**
 * Tareas de fondo de toda la app (no pinta nada): escuchar la sesión,
 * reintentar la subida de cambios y mantener fresco el historial.
 */
export default function Arranque() {
  const { usuario } = useCuenta();
  const ultimaDescarga = useRef(0);
  const userId = usuario?.id ?? null;

  useEffect(() => escucharCuenta(), []);

  useEffect(() => {
    podarSesionesAntiguas(getFechaISOHoy());

    const alConectar = () => void sincronizar();
    const intervalo = setInterval(() => void sincronizar(), 30_000);
    window.addEventListener("online", alConectar);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener("online", alConectar);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const descargar = () => {
      ultimaDescarga.current = Date.now();
      void recargarHistorial(getFechaISOHoy());
    };
    const alVolver = () => {
      if (document.visibilityState !== "visible") return;
      void sincronizar();
      if (Date.now() - ultimaDescarga.current > REFRESCO_HISTORIAL_MS) descargar();
    };

    descargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [userId]);

  return null;
}
