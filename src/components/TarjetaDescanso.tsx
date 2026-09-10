import type { DiaRutina } from "@/types/rutina";

interface Props {
  dia: DiaRutina;
}

export default function TarjetaDescanso({ dia }: Props) {
  return (
    <article className="rounded-2xl border border-descanso/30 bg-descanso-tenue p-6 text-center">
      <p className="text-4xl" aria-hidden="true">
        😴
      </p>
      <h2 className="mt-2 text-2xl font-bold text-descanso">Día de descanso</h2>
      <p className="mt-2 text-base leading-snug text-tenue">
        {dia.notas ||
          "Hoy no toca gimnasio. Come bien, duerme y deja que el músculo se recupere."}
      </p>
    </article>
  );
}
