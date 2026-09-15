import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PantallaEjercicio from "@/components/PantallaEjercicio";
import { getDia, getSemana } from "@/lib/rutina";

/** Una página por cada ejercicio de cada día (exportación estática). */
export function generateStaticParams() {
  return getSemana().flatMap((dia) =>
    dia.ejercicios.map((ejercicio) => ({ dia: dia.dia, ejercicio: ejercicio.id })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/dia/[dia]/ejercicio/[ejercicio]">): Promise<Metadata> {
  const { dia, ejercicio } = await params;
  const nombre = getDia(dia)?.ejercicios.find((e) => e.id === ejercicio)?.nombre;
  return { title: nombre ?? "Ejercicio" };
}

export default async function PaginaEjercicio({
  params,
}: PageProps<"/dia/[dia]/ejercicio/[ejercicio]">) {
  const { dia, ejercicio } = await params;
  const datos = getDia(dia);

  if (!datos || !datos.ejercicios.some((e) => e.id === ejercicio)) {
    notFound();
  }

  return <PantallaEjercicio dia={datos} ejercicioId={ejercicio} />;
}
