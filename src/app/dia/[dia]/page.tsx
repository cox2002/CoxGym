import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VistaDia from "@/components/VistaDia";
import { DIAS, getDia } from "@/lib/rutina";

/** Genera las 7 páginas de detalle al compilar (exportación estática). */
export function generateStaticParams() {
  return DIAS.map((dia) => ({ dia }));
}

/** Solo existen los 7 días: cualquier otra ruta es 404. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/dia/[dia]">): Promise<Metadata> {
  const { dia } = await params;
  const datos = getDia(dia);

  return {
    title: datos ? `${datos.nombreDia} · ${datos.titulo}` : "Día",
  };
}

export default async function PaginaDia({ params }: PageProps<"/dia/[dia]">) {
  const { dia } = await params;
  const datos = getDia(dia);

  if (!datos) {
    notFound();
  }

  return <VistaDia dia={datos} conVolver />;
}
