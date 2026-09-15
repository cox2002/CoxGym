import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ResumenSesion from "@/components/ResumenSesion";
import { DIAS, getDia } from "@/lib/rutina";

export function generateStaticParams() {
  return DIAS.map((dia) => ({ dia }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: "Resumen de la sesión",
};

export default async function PaginaResumen({ params }: PageProps<"/dia/[dia]/resumen">) {
  const { dia } = await params;
  const datos = getDia(dia);

  if (!datos) {
    notFound();
  }

  return <ResumenSesion dia={datos} />;
}
