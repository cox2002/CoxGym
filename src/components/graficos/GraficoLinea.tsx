"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { escalaY, useAncho } from "@/components/graficos/escala";
import { diasEntre, fechaCorta } from "@/lib/fechas";

export interface PuntoLinea {
  /** "YYYY-MM-DD": el eje X respeta los días reales entre puntos. */
  fecha: string;
  valor: number;
  /** Segunda línea del tooltip: "82,5 kg × 5". */
  detalle?: string;
}

interface Props {
  titulo: string;
  puntos: PuntoLinea[];
  formatear: (valor: number) => string;
  formatearEje?: (valor: number) => string;
  alto?: number;
}

const MARGEN = { izquierda: 40, derecha: 12, arriba: 26, abajo: 22 };
const ACENTO = "#38bdf8";
const SUPERFICIE = "#0f1418";

/** Línea con retícula que sigue al dedo, valor final rotulado y tabla para lectores de pantalla. */
export default function GraficoLinea({
  titulo,
  puntos,
  formatear,
  formatearEje = formatear,
  alto = 130,
}: Props) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const [activo, setActivo] = useState<number | null>(null);

  const altoTotal = MARGEN.arriba + alto + MARGEN.abajo;
  const escala = escalaY(puntos.map((p) => p.valor), { desdeCero: false });
  const anchoPlot = Math.max(0, ancho - MARGEN.izquierda - MARGEN.derecha);
  const primera = puntos[0]?.fecha ?? "";
  const totalDias = Math.max(1, diasEntre(primera, puntos[puntos.length - 1]?.fecha ?? primera));

  const x = (fecha: string) =>
    puntos.length === 1
      ? MARGEN.izquierda + anchoPlot / 2
      : MARGEN.izquierda + (diasEntre(primera, fecha) / totalDias) * anchoPlot;
  const y = (valor: number) =>
    MARGEN.arriba + alto - ((valor - escala.min) / (escala.max - escala.min)) * alto;

  const linea = puntos.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.fecha)},${y(p.valor)}`).join(" ");
  const ultimo = puntos[puntos.length - 1];
  const area =
    puntos.length > 1
      ? `${linea} L${x(ultimo.fecha)},${MARGEN.arriba + alto} L${x(primera)},${MARGEN.arriba + alto} Z`
      : "";

  /** El punto más cercano en X: basta apuntar a la fecha, no a la línea. */
  function alMover(evento: PointerEvent<HTMLDivElement>) {
    if (puntos.length === 0) return;
    const caja = evento.currentTarget.getBoundingClientRect();
    const px = evento.clientX - caja.left;
    let mejor = 0;
    puntos.forEach((p, i) => {
      if (Math.abs(x(p.fecha) - px) < Math.abs(x(puntos[mejor].fecha) - px)) mejor = i;
    });
    setActivo(mejor);
  }

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
    evento.preventDefault();
    const paso = evento.key === "ArrowRight" ? 1 : -1;
    setActivo((i) => Math.min(puntos.length - 1, Math.max(0, (i ?? puntos.length - 1) + paso)));
  }

  const seleccion = activo !== null ? puntos[activo] : null;

  return (
    <div className="relative select-none" style={{ height: altoTotal }}>
      <div ref={ref} className="absolute inset-0">
        {ancho > 0 && puntos.length > 0 && (
          <svg width={ancho} height={altoTotal} aria-hidden="true">
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

            {area && <path d={area} fill={ACENTO} fillOpacity={0.1} />}
            {puntos.length > 1 && (
              <path
                d={linea}
                fill="none"
                stroke={ACENTO}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {seleccion && (
              <line
                x1={x(seleccion.fecha)}
                x2={x(seleccion.fecha)}
                y1={MARGEN.arriba - 6}
                y2={MARGEN.arriba + alto}
                stroke="#3a4550"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
            )}

            {/* Punto final (o el seleccionado) con aro del color de la tarjeta. */}
            {(seleccion ? [seleccion] : [ultimo]).map((p) => (
              <circle
                key={p.fecha}
                cx={x(p.fecha)}
                cy={y(p.valor)}
                r={4.5}
                fill={ACENTO}
                stroke={SUPERFICIE}
                strokeWidth={2}
              />
            ))}

            {!seleccion && (
              <text
                x={Math.min(x(ultimo.fecha), ancho - MARGEN.derecha)}
                y={y(ultimo.valor) - 11}
                textAnchor={puntos.length === 1 ? "middle" : "end"}
                className="fill-texto text-[11px] font-bold tabular-nums"
              >
                {formatear(ultimo.valor)}
              </text>
            )}

            <text
              x={puntos.length === 1 ? x(primera) : MARGEN.izquierda}
              y={MARGEN.arriba + alto + 15}
              textAnchor={puntos.length === 1 ? "middle" : "start"}
              className="fill-apagado text-[10px] font-semibold"
            >
              {fechaCorta(primera)}
            </text>
            {puntos.length > 1 && (
              <text
                x={ancho - MARGEN.derecha}
                y={MARGEN.arriba + alto + 15}
                textAnchor="end"
                className="fill-apagado text-[10px] font-semibold"
              >
                {fechaCorta(ultimo.fecha)}
              </text>
            )}
          </svg>
        )}
      </div>

      {/* Con el dedo el tooltip queda fijo al soltar; con el mouse se va al salir. */}
      <div
        role="group"
        tabIndex={0}
        aria-label={`${titulo}. Usa las flechas para recorrer los puntos.`}
        className="absolute inset-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-acento/50"
        style={{ touchAction: "pan-y" }}
        onPointerDown={alMover}
        onPointerMove={alMover}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActivo(null)}
        onPointerCancel={() => setActivo(null)}
        onKeyDown={alTeclear}
        onBlur={() => setActivo(null)}
      />

      {seleccion && ancho > 0 && (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-44 -translate-x-1/2 rounded-xl border border-borde-alto bg-[#161c23] px-3 py-2 shadow-lg"
          style={{
            left: Math.min(Math.max(x(seleccion.fecha), 72), ancho - 72),
            top: Math.max(0, y(seleccion.valor) - 64),
          }}
          aria-live="polite"
        >
          <p className="text-[15px] font-extrabold tabular-nums">{formatear(seleccion.valor)}</p>
          <p className="text-[11px] text-tenue">
            {fechaCorta(seleccion.fecha)}
            {seleccion.detalle && ` · ${seleccion.detalle}`}
          </p>
        </div>
      )}

      <table className="sr-only">
        <caption>{titulo}</caption>
        <tbody>
          {puntos.map((p) => (
            <tr key={p.fecha}>
              <th scope="row">{fechaCorta(p.fecha)}</th>
              <td>
                {formatear(p.valor)}
                {p.detalle && ` (${p.detalle})`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
