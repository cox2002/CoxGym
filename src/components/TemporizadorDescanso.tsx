"use client";

import { useEffect, useState } from "react";
import {
  avisarFinDescanso,
  saltarDescanso,
  sumarDescanso,
  useDescanso,
} from "@/lib/descanso";
import { reloj } from "@/lib/fechas";

/** Si la app estaba cerrada cuando terminó el descanso, no pitar al abrirla. */
const MARGEN_AVISO_MS = 5000;

/** Píldora flotante con la cuenta regresiva del descanso, sobre la navegación. */
export default function TemporizadorDescanso() {
  const { finEn, total } = useDescanso();
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (finEn === null) return;
    setAhora(Date.now());
    const intervalo = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(intervalo);
  }, [finEn]);

  const restanteMs = finEn === null ? 0 : finEn - ahora;

  useEffect(() => {
    if (finEn === null || restanteMs > 0) return;
    if (-restanteMs < MARGEN_AVISO_MS) avisarFinDescanso();
    saltarDescanso();
  }, [finEn, restanteMs]);

  if (finEn === null || restanteMs <= 0) return null;

  const progreso = total > 0 ? Math.min(1, restanteMs / (total * 1000)) : 0;

  return (
    <div
      role="timer"
      aria-live="off"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-30 mx-auto max-w-md px-3.5 animate-entra"
    >
      <div className="relative flex items-center gap-3.5 overflow-hidden rounded-[20px] border border-[#1f2b35] bg-[rgba(14,20,26,0.92)] px-4 py-3 backdrop-blur-[14px]">
        <div className="flex size-[34px] shrink-0 animate-latido items-center justify-center rounded-full border-[1.5px] border-acento-borde">
          <div className="size-2 rounded-full bg-acento" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[1.2px] text-apagado uppercase">Descanso</p>
          <p className="mt-0.5 text-[19px] leading-tight font-extrabold tabular-nums">
            {reloj(Math.ceil(restanteMs / 1000))}
          </p>
        </div>

        <button
          type="button"
          onClick={() => sumarDescanso(15)}
          className="rounded-xl border border-borde-alto px-3 py-2 text-[13px] font-bold text-suave tabular-nums"
        >
          +15 s
        </button>
        <button
          type="button"
          onClick={saltarDescanso}
          className="px-1 py-2 text-[13px] font-bold text-acento"
        >
          Saltar
        </button>

        <div
          className="absolute bottom-0 left-0 h-0.5 bg-acento transition-[width] duration-300 ease-linear"
          style={{ width: `${progreso * 100}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
