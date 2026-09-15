"use client";

import { useEffect, useState } from "react";

/** Date.now() que se actualiza cada `cadaMs` mientras `activo` sea true (cronómetros). */
export function useAhora(activo: boolean, cadaMs = 1000): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!activo) return;
    setAhora(Date.now());
    const intervalo = setInterval(() => setAhora(Date.now()), cadaMs);
    return () => clearInterval(intervalo);
  }, [activo, cadaMs]);

  return ahora;
}
