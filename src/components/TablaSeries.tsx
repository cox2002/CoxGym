"use client";

import Icono from "@/components/Icono";
import type { SerieRegistro } from "@/lib/entreno";

export interface Sugerencia {
  reps: string;
  peso: string;
}

type Campo = "reps" | "peso" | "rpe";

interface Props {
  filas: SerieRegistro[];
  /** Lo que se muestra en gris si el campo está vacío (la última vez o el objetivo). */
  sugerencias: Sugerencia[];
  onCambiar: (indice: number, campo: Campo, valor: string) => void;
  onAlternar: (indice: number) => void;
  onAgregar: () => void;
  onQuitar: () => void;
}

/** Deja solo lo que tiene sentido en cada campo mientras se escribe. */
function limpiar(campo: Campo, valor: string): string {
  if (campo === "reps") return valor.replace(/\D/g, "").slice(0, 3);
  const numero = valor.replace(/[^\d.,]/g, "");
  const separador = numero.search(/[.,]/);
  const unico =
    separador === -1
      ? numero
      : numero.slice(0, separador + 1) + numero.slice(separador + 1).replace(/[.,]/g, "");
  return unico.slice(0, campo === "peso" ? 6 : 4);
}

const COLUMNAS = "grid grid-cols-[26px_1fr_1fr_1fr_38px] items-center gap-2";

export default function TablaSeries({
  filas,
  sugerencias,
  onCambiar,
  onAlternar,
  onAgregar,
  onQuitar,
}: Props) {
  return (
    <div>
      <div
        className={`${COLUMNAS} px-2 pb-2 text-[10.5px] font-bold tracking-[1.2px] text-apagado uppercase`}
        aria-hidden="true"
      >
        <span className="text-center">#</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Kg</span>
        <span className="text-center">RPE</span>
        <span />
      </div>

      <ol className="grid gap-[7px]">
        {filas.map((fila, indice) => {
          const sugerencia = sugerencias[indice] ?? { reps: "", peso: "" };
          const numero = indice + 1;
          const campo = (nombre: Campo, etiqueta: string, modo: "numeric" | "decimal", pista: string) => (
            <input
              type="text"
              inputMode={modo}
              enterKeyHint="next"
              autoComplete="off"
              aria-label={`${etiqueta}, serie ${numero}`}
              value={fila[nombre]}
              placeholder={fila.hecha ? "" : pista}
              onChange={(e) => onCambiar(indice, nombre, limpiar(nombre, e.target.value))}
              className={`w-full rounded-[10px] bg-campo py-2 text-center text-base font-bold tabular-nums outline-none placeholder:font-semibold placeholder:text-[#64707d] focus:ring-2 focus:ring-acento/60 ${
                nombre === "rpe" ? "text-tenue" : "text-texto"
              }`}
            />
          );

          return (
            <li
              key={indice}
              className={`${COLUMNAS} rounded-[15px] border p-2 transition-colors ${
                fila.hecha ? "border-acento-borde bg-[#0d1a22]" : "border-borde bg-superficie"
              }`}
            >
              <span className="text-center text-[13px] font-bold text-[#7b8794] tabular-nums">
                {numero}
              </span>
              {campo("reps", "Repeticiones", "numeric", sugerencia.reps)}
              {campo("peso", "Kilos", "decimal", sugerencia.peso)}
              {campo("rpe", "Esfuerzo percibido (RPE)", "decimal", "")}
              <button
                type="button"
                onClick={() => onAlternar(indice)}
                aria-pressed={fila.hecha}
                aria-label={`Serie ${numero} ${fila.hecha ? "hecha" : "sin marcar"}`}
                className={`flex size-[34px] items-center justify-center justify-self-center rounded-[10px] border transition-colors ${
                  fila.hecha
                    ? "border-acento bg-acento text-sobre-acento"
                    : "border-[#3a4550] bg-transparent text-[#3a4550]"
                }`}
              >
                <Icono nombre="check" className="size-4" grosor={3} />
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onAgregar}
          className="flex items-center justify-center gap-1.5 rounded-[14px] border border-borde bg-superficie py-2.5 text-[13px] font-bold text-suave"
        >
          <Icono nombre="mas" className="size-4" />
          Añadir serie
        </button>
        <button
          type="button"
          onClick={onQuitar}
          disabled={filas.length <= 1}
          className="flex items-center justify-center gap-1.5 rounded-[14px] border border-borde bg-superficie py-2.5 text-[13px] font-bold text-tenue disabled:opacity-40"
        >
          <Icono nombre="menos" className="size-4" />
          Quitar serie
        </button>
      </div>
    </div>
  );
}
