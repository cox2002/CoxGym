"use client";

import { useState, type FormEvent } from "react";
import GraficoLinea from "@/components/graficos/GraficoLinea";
import CampoNumero from "@/components/progreso/CampoNumero";
import Tarjeta, { Vacio } from "@/components/progreso/Tarjeta";
import { tendencia } from "@/lib/estadisticas";
import { fechaCorta, sumarDias } from "@/lib/fechas";
import { leerNumero, numero } from "@/lib/formato";
import { anotarPeso, type PesoHistorial } from "@/lib/historial";
import { encolar } from "@/lib/sincronizacion";

interface Props {
  pesos: PesoHistorial[];
  hoy: string;
}

const DIAS_GRAFICO = 120;

export default function PesoCorporal({ pesos, hoy }: Props) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { actual, cambio } = tendencia(pesos, (p) => p.peso_kg, hoy, 56);
  const desde = sumarDias(hoy, -DIAS_GRAFICO);
  const recientes = pesos.filter((p) => p.fecha >= desde);
  const deHoy = pesos.find((p) => p.fecha === hoy);

  function guardar(evento: FormEvent) {
    evento.preventDefault();
    const peso = leerNumero(texto);
    if (peso === null || peso <= 20 || peso >= 400) {
      setError("Escribe tu peso en kilos, por ejemplo 88,4.");
      return;
    }
    const redondeado = Math.round(peso * 100) / 100;
    anotarPeso(hoy, redondeado);
    encolar({ tipo: "peso", fecha: hoy, pesoKg: redondeado });
    setTexto("");
    setError(null);
  }

  return (
    <Tarjeta titulo="Peso corporal">
      {actual ? (
        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="text-[25px] leading-none font-extrabold tracking-[-0.7px]">
            {numero(actual.peso_kg, 1)}
            <span className="text-[13px] font-semibold tracking-normal text-tenue"> kg</span>
          </p>
          {cambio !== null && (
            <span className="rounded-full bg-acento-fondo px-2.5 py-1 text-[11px] font-bold text-acento-claro tabular-nums">
              {cambio > 0 ? "+" : cambio < 0 ? "−" : ""}
              {numero(Math.abs(cambio), 1)} kg · 8 sem.
            </span>
          )}
        </div>
      ) : (
        <Vacio>Registra tu peso una vez por semana, siempre a la misma hora, para ver la tendencia.</Vacio>
      )}

      {recientes.length > 1 && (
        <div className="mt-3">
          <GraficoLinea
            titulo="Peso corporal"
            puntos={recientes.map((p) => ({ fecha: p.fecha, valor: p.peso_kg }))}
            formatear={(v) => `${numero(v, 1)} kg`}
            formatearEje={(v) => numero(v, 1)}
            alto={110}
          />
        </div>
      )}

      <form onSubmit={guardar} className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <CampoNumero
            etiqueta={deHoy ? `Hoy ya registraste ${numero(deHoy.peso_kg, 1)} kg` : `Peso de hoy · ${fechaCorta(hoy)}`}
            unidad="kg"
            valor={texto}
            onCambiar={setTexto}
            placeholder={actual ? numero(actual.peso_kg, 1) : "88,0"}
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-acento px-4 py-[11px] text-[14px] font-extrabold text-sobre-acento"
        >
          {deHoy ? "Corregir" : "Guardar"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-peligro">
          {error}
        </p>
      )}
    </Tarjeta>
  );
}
