import datos from "@/data/ejercicios-dataset.json";

/**
 * Información del dataset hasaneyldrm/exercises-dataset para cada ejercicio
 * de la rutina (se genera con scripts/importar-ejercicios.mjs).
 *
 * Los textos son MIT. Las animaciones e imágenes son © Gym visual: no se
 * copian al proyecto, se enlazan desde el repositorio original con su crédito.
 */

export interface InfoEjercicio {
  /** Nombre original en inglés. */
  nombre: string;
  /** Equipo, ya traducido: "Barra", "Polea"... */
  equipo: string;
  /** Pasos de ejecución en español. */
  pasos: string[];
  /** URL de la animación (GIF 180×180). */
  gif: string;
  /** URL de la imagen fija (JPG 180×180). */
  imagen: string;
}

export const CREDITO_ANIMACIONES = {
  texto: "© Gym visual",
  url: "https://gymvisual.com/",
} as const;

const BASE_MEDIA = `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/${datos.commit}/`;

const EQUIPO: Record<string, string> = {
  barbell: "Barra",
  "ez barbell": "Barra Z",
  dumbbell: "Mancuernas",
  cable: "Polea",
  "leverage machine": "Máquina",
  "sled machine": "Máquina",
  "body weight": "Peso corporal",
};

const ejercicios: Record<string, (typeof datos.ejercicios)[keyof typeof datos.ejercicios]> =
  datos.ejercicios;

export function getInfoEjercicio(animacion: string): InfoEjercicio | undefined {
  const e = animacion ? ejercicios[animacion] : undefined;
  if (!e) return undefined;

  return {
    nombre: e.nombre,
    equipo: EQUIPO[e.equipo] ?? e.equipo,
    pasos: e.pasos,
    gif: BASE_MEDIA + e.gif,
    imagen: BASE_MEDIA + e.imagen,
  };
}
