/**
 * Tipos de la rutina. Reflejan la estructura de src/data/rutina.json.
 * Si mañana los datos vienen de una base de datos, estos tipos siguen siendo
 * el contrato: solo cambia de dónde los lee src/lib/rutina.ts.
 */

export type DiaSemana =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export type TipoDia = "entrenamiento" | "descanso";

/** Zonas del mapa corporal. Coinciden con el componente MapaCuerpo. */
export type Musculo =
  | "pecho"
  | "hombro"
  | "hombroPost"
  | "biceps"
  | "triceps"
  | "espalda"
  | "trapecio"
  | "core"
  | "gluteo"
  | "isquios"
  | "cuadriceps"
  | "gemelo"
  | "antebrazo";

export interface Ejercicio {
  id: string;
  nombre: string;
  series: number;
  /** Rango de repeticiones, en texto: "8-10", "12", "al fallo"... */
  repeticiones: string;
  descansoSeg: number;
  /** Vacío mientras no esté definido. */
  pesoSugerido: string;
  /** Ejercicio de reemplazo si la máquina está ocupada. Puede ir vacío. */
  alternativa: string;
  notas: string;
  /** Músculos trabajados; el primero es el principal. */
  musculos: Musculo[];
  /** Id de 4 dígitos en el dataset de ejercicios. Vacío si no tiene animación. */
  animacion: string;
}

export interface DiaRutina {
  dia: DiaSemana;
  nombreDia: string;
  tipo: TipoDia;
  titulo: string;
  gruposMusculares: string[];
  ejercicios: Ejercicio[];
  /** Cardio del día. Puede ir vacío. */
  cardio: string;
  /** Nota del día (fútbol, descanso, etc.). Puede ir vacía. */
  notas: string;
}

export interface Perfil {
  tallaCm: number;
  pesoKg: number;
  somatotipo: string;
  objetivo: string;
}

export interface IndicacionesGenerales {
  calentamiento: string;
  progresion: string;
  otras: string;
}

export interface Rutina {
  /** Fecha de última actualización del JSON (YYYY-MM-DD). */
  actualizado: string;
  perfil: Perfil;
  indicacionesGenerales: IndicacionesGenerales;
  semana: DiaRutina[];
}
