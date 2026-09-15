"use client";

import { useState, type FormEvent } from "react";
import CampoNumero from "@/components/progreso/CampoNumero";
import Tarjeta from "@/components/progreso/Tarjeta";
import { fechaCorta } from "@/lib/fechas";
import { leerNumero, numero } from "@/lib/formato";
import { anotarMedida, type MedidaHistorial } from "@/lib/historial";
import { encolar } from "@/lib/sincronizacion";

interface Props {
  medidas: MedidaHistorial[];
  hoy: string;
}

/** Zonas que acepta la base de datos, en el orden en que se muestran. */
const ZONAS = [
  { clave: "brazo", nombre: "Brazo" },
  { clave: "pecho", nombre: "Pecho" },
  { clave: "cintura", nombre: "Cintura" },
  { clave: "muslo", nombre: "Muslo" },
  { clave: "cadera", nombre: "Cadera" },
  { clave: "gemelo", nombre: "Gemelo" },
] as const;

export default function Medidas({ medidas, hoy }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const porZona = ZONAS.map((zona) => {
    const entradas = medidas.filter((m) => m.zona === zona.clave);
    const ultima = entradas[entradas.length - 1];
    const previa = entradas[entradas.length - 2];
    return {
      ...zona,
      ultima,
      cambio: ultima && previa ? ultima.valor_cm - previa.valor_cm : null,
    };
  });
  // Siempre las cuatro principales; las otras solo si ya tienen datos.
  const visibles = porZona.filter((z, i) => i < 4 || z.ultima);
  const ultimaFecha = medidas.reduce<string | null>((f, m) => (!f || m.fecha > f ? m.fecha : f), null);

  function guardar(evento: FormEvent) {
    evento.preventDefault();
    const validas = ZONAS.flatMap((zona) => {
      const valor = leerNumero(valores[zona.clave] ?? "");
      return valor === null ? [] : [{ zona: zona.clave, valor }];
    });
    if (validas.length === 0) {
      setError("Escribe al menos una medida.");
      return;
    }
    if (validas.some((v) => v.valor <= 0 || v.valor >= 300)) {
      setError("Las medidas van en centímetros, entre 1 y 299.");
      return;
    }
    for (const { zona, valor } of validas) {
      const cm = Math.round(valor * 10) / 10;
      anotarMedida(hoy, zona, cm);
      encolar({ tipo: "medida", fecha: hoy, zona, valorCm: cm });
    }
    setValores({});
    setError(null);
    setAbierto(false);
  }

  return (
    <Tarjeta
      titulo="Medidas"
      extra={
        ultimaFecha && <span className="text-[11px] font-semibold text-apagado">{fechaCorta(ultimaFecha)}</span>
      }
    >
      <dl className="mt-3.5 grid grid-cols-2 gap-3.5">
        {visibles.map((zona) => (
          <div key={zona.clave}>
            <dt className="text-[11.5px] text-tenue">{zona.nombre}</dt>
            <dd className="mt-1 text-[19px] font-bold tabular-nums">
              {zona.ultima ? `${numero(zona.ultima.valor_cm, 1)} cm` : "—"}
              {zona.cambio !== null && zona.cambio !== 0 && (
                <span className="ml-1.5 text-[11px] font-bold text-suave">
                  {zona.cambio > 0 ? "+" : "−"}
                  {numero(Math.abs(zona.cambio), 1)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {abierto ? (
        <form onSubmit={guardar} className="mt-4 border-t border-borde pt-4">
          <div className="grid grid-cols-2 gap-2.5">
            {ZONAS.map((zona) => (
              <CampoNumero
                key={zona.clave}
                etiqueta={zona.nombre}
                unidad="cm"
                valor={valores[zona.clave] ?? ""}
                onCambiar={(v) => setValores((actual) => ({ ...actual, [zona.clave]: v }))}
                placeholder={porZona.find((z) => z.clave === zona.clave)?.ultima?.valor_cm.toString()}
              />
            ))}
          </div>
          {error && (
            <p role="alert" className="mt-2 text-xs font-semibold text-peligro">
              {error}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-xl border border-borde-alto py-2.5 text-[14px] font-bold text-tenue"
            >
              Cancelar
            </button>
            <button type="submit" className="rounded-xl bg-acento py-2.5 text-[14px] font-extrabold text-sobre-acento">
              Guardar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-4 w-full rounded-xl border border-borde-alto py-2.5 text-[13px] font-bold text-suave"
        >
          Registrar medidas de hoy
        </button>
      )}
    </Tarjeta>
  );
}
