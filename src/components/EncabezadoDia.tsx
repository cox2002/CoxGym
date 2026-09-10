import type { DiaRutina } from "@/types/rutina";

interface Props {
  dia: DiaRutina;
  /** Texto pequeño arriba del título: "Hoy", la fecha, etc. */
  sobretitulo?: string;
}

export default function EncabezadoDia({ dia, sobretitulo }: Props) {
  return (
    <header className="px-4 pt-6 pb-4">
      {sobretitulo && (
        <p className="text-sm font-semibold uppercase tracking-wide text-acento">
          {sobretitulo}
        </p>
      )}

      <h1 className="mt-1 text-3xl font-bold leading-tight">{dia.nombreDia}</h1>
      <p className="mt-1 text-xl text-tenue">{dia.titulo}</p>

      {dia.gruposMusculares.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {dia.gruposMusculares.map((grupo) => (
            <li
              key={grupo}
              className="rounded-full bg-superficie-alta px-3 py-1 text-sm text-tenue"
            >
              {grupo}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
