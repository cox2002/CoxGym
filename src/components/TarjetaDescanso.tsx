import type { DiaRutina } from "@/types/rutina";

interface Props {
  dia: DiaRutina;
}

export default function TarjetaDescanso({ dia }: Props) {
  return (
    <article className="rounded-[22px] border border-borde bg-superficie px-[22px] py-[34px] text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-[#262f39]">
        <div className="h-0.5 w-3.5 rounded-sm bg-apagado" />
      </div>
      <h2 className="mt-4 text-[19px] font-bold">Día de descanso</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-tenue text-pretty">
        {dia.notas ||
          "Sin gimnasio hoy. Come bien, duerme 7-9 h y deja que el músculo se recupere."}
      </p>
    </article>
  );
}
