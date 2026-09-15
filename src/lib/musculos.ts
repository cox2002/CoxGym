import type { DiaRutina, Musculo } from "@/types/rutina";

export const NOMBRE_MUSCULO: Record<Musculo, string> = {
  pecho: "Pecho",
  hombro: "Hombro",
  hombroPost: "Deltoide post.",
  biceps: "Bíceps",
  triceps: "Tríceps",
  espalda: "Espalda",
  trapecio: "Trapecio",
  core: "Core",
  gluteo: "Glúteo",
  isquios: "Isquios",
  cuadriceps: "Cuádriceps",
  gemelo: "Gemelo",
  antebrazo: "Antebrazo",
};

/** Músculos del día sin repetir, en el orden en que aparecen. */
export function musculosDelDia(dia: DiaRutina): Musculo[] {
  const vistos = new Set<Musculo>();
  for (const ejercicio of dia.ejercicios) {
    for (const musculo of ejercicio.musculos) vistos.add(musculo);
  }
  return [...vistos];
}
