import type { DiaRutina } from "@/types/rutina";

interface Props {
  dia: DiaRutina;
  /** Texto pequeño en cian arriba del título: "Hoy · 15 de setiembre", "Martes"... */
  sobretitulo: string;
}

export default function EncabezadoDia({ dia, sobretitulo }: Props) {
  return (
    <header>
      <p className="min-h-4 text-[11px] font-bold tracking-[1.6px] text-acento uppercase">
        {sobretitulo}
      </p>
      <h1 className="mt-2 text-[30px] leading-[1.1] font-extrabold tracking-[-0.6px] text-pretty">
        {dia.titulo}
      </h1>

      {dia.gruposMusculares.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {dia.gruposMusculares.map((grupo) => (
            <li
              key={grupo}
              className="rounded-full border border-borde-alto bg-superficie-alta px-[11px] py-[5px] text-[11.5px] font-semibold text-[#96a3b1]"
            >
              {grupo}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
