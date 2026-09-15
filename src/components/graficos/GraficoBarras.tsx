"use client";

import { useState } from "react";
import { escalaY, useAncho } from "@/components/graficos/escala";

export interface Barra {
  clave: string;
  /** Texto corto bajo la barra: "8/9". */
  etiqueta: string;
  /** Texto del tooltip y de la tabla: "Semana del 8 set.". */
  descripcion: string;
  valor: number;
}

interface Props {
  titulo: string;
  barras: Barra[];
  /** La barra que cuenta la historia (la semana actual) va en el acento. */
  destacada?: string;
  formatear: (valor: number) => string;
  formatearEje?: (valor: number) => string;
  alto?: number;
}

const MARGEN = { izquierda: 36, derecha: 4, arriba: 22, abajo: 22 };
const COLORES = {
  destacada: "#38bdf8",
  destacadaActiva: "#7dd3fc",
  normal: "#56687a",
  normalActiva: "#7890a6",
};

/** Barra con esquinas de 4px arriba y base recta. */
function trazoBarra(x: number, arriba: number, base: number, grosor: number): string {
  const alto = base - arriba;
  if (alto <= 0) return "";
  const r = Math.min(4, alto, grosor / 2);
  return [
    `M${x},${base}`,
    `V${arriba + r}`,
    `A${r},${r} 0 0 1 ${x + r},${arriba}`,
    `H${x + grosor - r}`,
    `A${r},${r} 0 0 1 ${x + grosor},${arriba + r}`,
    `V${base}`,
    "Z",
  ].join(" ");
}

/** Columnas con tooltip al tocar o pasar el mouse, y tabla equivalente para lectores de pantalla. */
export default function GraficoBarras({
  titulo,
  barras,
  destacada,
  formatear,
  formatearEje = formatear,
  alto = 120,
}: Props) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const [activa, setActiva] = useState<string | null>(null);

  const escala = escalaY(barras.map((b) => b.valor), { desdeCero: true });
  const anchoPlot = Math.max(0, ancho - MARGEN.izquierda - MARGEN.derecha);
  const banda = barras.length > 0 ? anchoPlot / barras.length : 0;
  const grosor = Math.min(24, banda * 0.62);
  const y = (valor: number) =>
    MARGEN.arriba + alto - ((valor - escala.min) / (escala.max - escala.min)) * alto;
  const base = y(escala.min);
  const centro = (i: number) => MARGEN.izquierda + banda * (i + 0.5);

  const indiceActivo = barras.findIndex((b) => b.clave === activa);
  const seleccion = indiceActivo >= 0 ? barras[indiceActivo] : null;

  return (
    <div
      ref={ref}
      className="relative select-none"
      style={{ height: MARGEN.arriba + alto + MARGEN.abajo }}
      onPointerLeave={(e) => e.pointerType === "mouse" && setActiva(null)}
    >
      {ancho > 0 && (
        <svg width={ancho} height={MARGEN.arriba + alto + MARGEN.abajo} aria-hidden="true">
          {escala.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGEN.izquierda}
                x2={ancho - MARGEN.derecha}
                y1={y(tick)}
                y2={y(tick)}
                stroke="#1b222a"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={MARGEN.izquierda - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-apagado text-[10px] font-semibold tabular-nums"
              >
                {formatearEje(tick)}
              </text>
            </g>
          ))}

          {barras.map((barra, i) => {
            const esDestacada = barra.clave === destacada;
            const esActiva = barra.clave === activa;
            const arriba = y(barra.valor);
            const color = esDestacada
              ? esActiva
                ? COLORES.destacadaActiva
                : COLORES.destacada
              : esActiva
                ? COLORES.normalActiva
                : COLORES.normal;

            return (
              <g key={barra.clave}>
                <path d={trazoBarra(centro(i) - grosor / 2, arriba, base, grosor)} fill={color} />
                {esDestacada && barra.valor > 0 && !esActiva && (
                  <text
                    x={centro(i)}
                    y={arriba - 7}
                    textAnchor="middle"
                    className="fill-texto text-[11px] font-bold tabular-nums"
                  >
                    {formatear(barra.valor)}
                  </text>
                )}
                <text
                  x={centro(i)}
                  y={base + 15}
                  textAnchor="middle"
                  className={`text-[10px] font-semibold tabular-nums ${
                    esDestacada ? "fill-suave" : "fill-apagado"
                  }`}
                >
                  {barra.etiqueta}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {/* Zonas táctiles: toda la columna de cada barra, no solo la parte pintada. */}
      <div
        className="absolute flex"
        style={{ left: MARGEN.izquierda, right: MARGEN.derecha, top: 0, bottom: MARGEN.abajo }}
      >
        {barras.map((barra) => (
          <button
            key={barra.clave}
            type="button"
            className="h-full flex-1 rounded-md outline-none focus-visible:bg-white/5"
            aria-label={`${barra.descripcion}: ${formatear(barra.valor)}`}
            onPointerEnter={(e) => e.pointerType === "mouse" && setActiva(barra.clave)}
            onFocus={() => setActiva(barra.clave)}
            onBlur={() => setActiva(null)}
            onClick={() => setActiva(barra.clave)}
          />
        ))}
      </div>

      {seleccion && ancho > 0 && (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-40 -translate-x-1/2 rounded-xl border border-borde-alto bg-[#161c23] px-3 py-2 shadow-lg"
          style={{
            left: Math.min(Math.max(centro(indiceActivo), 64), ancho - 64),
            top: Math.max(0, y(seleccion.valor) - 52),
          }}
        >
          <p className="text-[15px] font-extrabold tabular-nums">{formatear(seleccion.valor)}</p>
          <p className="text-[11px] text-tenue">{seleccion.descripcion}</p>
        </div>
      )}

      <table className="sr-only">
        <caption>{titulo}</caption>
        <tbody>
          {barras.map((barra) => (
            <tr key={barra.clave}>
              <th scope="row">{barra.descripcion}</th>
              <td>{formatear(barra.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
