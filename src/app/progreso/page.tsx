"use client";

import Link from "next/link";
import Icono from "@/components/Icono";
import FotosProgreso from "@/components/progreso/FotosProgreso";
import Medidas from "@/components/progreso/Medidas";
import PesoCorporal from "@/components/progreso/PesoCorporal";
import ProgresoEjercicio from "@/components/progreso/ProgresoEjercicio";
import RecordsPersonales from "@/components/progreso/RecordsPersonales";
import ResumenSemanal from "@/components/progreso/ResumenSemanal";
import SeriesPorMusculo from "@/components/progreso/SeriesPorMusculo";
import { useCuenta } from "@/lib/cuenta";
import { useHistorialEntreno, useHistorialNube } from "@/lib/historial";
import { useHoy } from "@/lib/hoy";
import { usePendientes } from "@/lib/sincronizacion";

function EstadoCuenta() {
  const { cargando, usuario } = useCuenta();
  const pendientes = usePendientes();

  if (cargando) return <span className="h-8 w-20" />;

  return (
    <Link
      href="/cuenta"
      className="flex items-center gap-1.5 rounded-full border border-borde-alto bg-superficie px-3 py-1.5 text-[12px] font-bold text-suave"
    >
      <Icono nombre={usuario ? "nube" : "usuario"} className="size-4" grosor={1.9} />
      {!usuario ? "Entrar" : pendientes > 0 ? `${pendientes} sin subir` : "En la nube"}
    </Link>
  );
}

export default function PaginaProgreso() {
  const hoy = useHoy();
  const historial = useHistorialEntreno();
  const nube = useHistorialNube();
  const { cargando, usuario } = useCuenta();

  return (
    <div className="animate-entra px-[22px] pt-3.5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[1.6px] text-apagado uppercase">Resultados</p>
          <h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.6px]">Progreso</h1>
        </div>
        <div className="pt-1">
          <EstadoCuenta />
        </div>
      </header>

      {!cargando && !usuario && (
        <Link
          href="/cuenta"
          className="mt-[18px] flex items-center gap-3 rounded-[20px] border border-acento-borde bg-acento-fondo p-4"
        >
          <Icono nombre="nube" className="size-6 shrink-0 text-acento" grosor={1.8} />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold">Guarda tu progreso en la nube</span>
            <span className="mt-0.5 block text-[12px] text-tenue">
              Ahora todo queda solo en este teléfono. Inicia sesión para no perderlo.
            </span>
          </span>
          <Icono nombre="adelante" className="size-4 shrink-0 text-acento" />
        </Link>
      )}

      {hoy && (
        <div className="mt-[18px] grid gap-2">
          <ResumenSemanal historial={historial} hoy={hoy.fecha} />
          <ProgresoEjercicio historial={historial} />
          <PesoCorporal pesos={nube.pesos} hoy={hoy.fecha} />
          <RecordsPersonales historial={historial} hoy={hoy.fecha} />
          <Medidas medidas={nube.medidas} hoy={hoy.fecha} />
          <SeriesPorMusculo historial={historial} hoy={hoy.fecha} />
          <div className="mt-2">
            <FotosProgreso fotos={nube.fotos} hoy={hoy.fecha} userId={usuario?.id ?? null} />
          </div>
        </div>
      )}
    </div>
  );
}
