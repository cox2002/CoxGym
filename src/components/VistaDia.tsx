import EncabezadoDia from "@/components/EncabezadoDia";
import NotaDia from "@/components/NotaDia";
import TarjetaDescanso from "@/components/TarjetaDescanso";
import TarjetaEjercicio from "@/components/TarjetaEjercicio";
import type { DiaRutina } from "@/types/rutina";

interface Props {
  dia: DiaRutina;
  /** Texto pequeño arriba del título: "Hoy", la fecha, etc. */
  sobretitulo?: string;
}

/** Sesión completa de un día. La usan tanto "/" como "/dia/[dia]". */
export default function VistaDia({ dia, sobretitulo }: Props) {
  const esDescanso = dia.tipo === "descanso";

  return (
    <div className="pb-4">
      <EncabezadoDia dia={dia} sobretitulo={sobretitulo} />

      {/* En día de descanso la nota se muestra dentro de su propia tarjeta. */}
      {!esDescanso && dia.notas && <NotaDia texto={dia.notas} />}

      <div className="mt-4 space-y-3 px-4">
        {esDescanso ? (
          <TarjetaDescanso dia={dia} />
        ) : (
          dia.ejercicios.map((ejercicio, indice) => (
            <TarjetaEjercicio
              key={ejercicio.id}
              ejercicio={ejercicio}
              numero={indice + 1}
            />
          ))
        )}

        {dia.cardio && (
          <p className="rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-tenue">
            <span className="font-semibold text-texto">Cardio: </span>
            {dia.cardio}
          </p>
        )}
      </div>
    </div>
  );
}
