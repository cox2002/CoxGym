import type { Ejercicio } from "@/types/rutina";

interface Props {
  ejercicio: Ejercicio;
  /** Posición dentro de la sesión, empezando en 1. */
  numero: number;
}

function formatearDescanso(segundos: number): string {
  if (segundos >= 60 && segundos % 60 === 0) {
    return `${segundos / 60} min`;
  }
  return `${segundos} s`;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl bg-superficie-alta px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-tenue">{etiqueta}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{valor}</p>
    </div>
  );
}

export default function TarjetaEjercicio({ ejercicio, numero }: Props) {
  return (
    <article className="rounded-2xl border border-borde bg-superficie p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-acento-tenue text-base font-bold text-acento tabular-nums">
          {numero}
        </span>
        <h3 className="text-xl font-semibold leading-snug">
          {ejercicio.nombre}
        </h3>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Dato
          etiqueta="Series"
          valor={`${ejercicio.series} × ${ejercicio.repeticiones}`}
        />
        <Dato
          etiqueta="Descanso"
          valor={formatearDescanso(ejercicio.descansoSeg)}
        />
        <Dato etiqueta="Peso" valor={ejercicio.pesoSugerido || "—"} />
      </div>

      {ejercicio.notas && (
        <p className="mt-3 text-base leading-snug text-tenue">
          {ejercicio.notas}
        </p>
      )}

      {ejercicio.alternativa && (
        <p className="mt-2 text-base leading-snug text-tenue">
          <span className="font-semibold text-texto">Alternativa: </span>
          {ejercicio.alternativa}
        </p>
      )}
    </article>
  );
}
