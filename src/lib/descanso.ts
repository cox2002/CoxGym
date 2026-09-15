"use client";

import { crearAlmacen, useAlmacen } from "@/lib/almacen";

/**
 * Temporizador de descanso entre series. Guarda la hora de fin (no un
 * contador), así sigue exacto aunque se bloquee el teléfono o se cambie de
 * pantalla.
 */

interface EstadoDescanso {
  /** Date.now() en que termina; null si no hay descanso activo. */
  finEn: number | null;
  /** Duración total en segundos, para la barra de progreso. */
  total: number;
}

const almacenDescanso = crearAlmacen<EstadoDescanso>("coxgym:descanso:v1", {
  finEn: null,
  total: 0,
});

export function useDescanso(): EstadoDescanso {
  return useAlmacen(almacenDescanso);
}

let audio: AudioContext | null = null;

/** El navegador solo deja sonar audio si se prepara tras un toque del usuario. */
function prepararAudio() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    audio = null;
  }
}

export function iniciarDescanso(segundos: number) {
  if (segundos <= 0) return;
  prepararAudio();
  almacenDescanso.escribir({ finEn: Date.now() + segundos * 1000, total: segundos });
}

export function sumarDescanso(segundos: number) {
  almacenDescanso.actualizar((estado) =>
    estado.finEn === null
      ? estado
      : { finEn: estado.finEn + segundos * 1000, total: estado.total + segundos },
  );
}

export function saltarDescanso() {
  almacenDescanso.escribir({ finEn: null, total: 0 });
}

/** Dos pitidos cortos y vibración: se nota aunque el teléfono esté en el banco. */
export function avisarFinDescanso() {
  // Chrome bloquea (y reporta) la vibración si aún no se tocó la página.
  const activacion = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
    .userActivation;
  if (activacion?.hasBeenActive ?? true) navigator.vibrate?.([220, 120, 220]);
  if (!audio) return;

  const inicio = audio.currentTime;
  for (const desfase of [0, 0.28]) {
    const oscilador = audio.createOscillator();
    const volumen = audio.createGain();
    oscilador.type = "sine";
    oscilador.frequency.value = 880;
    volumen.gain.setValueAtTime(0.0001, inicio + desfase);
    volumen.gain.exponentialRampToValueAtTime(0.35, inicio + desfase + 0.02);
    volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + desfase + 0.2);
    oscilador.connect(volumen).connect(audio.destination);
    oscilador.start(inicio + desfase);
    oscilador.stop(inicio + desfase + 0.22);
  }
}
