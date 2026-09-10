import type { Metadata } from "next";
import Link from "next/link";
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

  return (
    <div>
      <div className="px-4 pt-6">
        <Link
          href="/semana"
          className="inline-flex items-center gap-1 text-base font-semibold text-acento"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
            aria-hidden="true"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
          Semana
        </Link>
      </div>

      <VistaDia dia={datos} />
    </div>
  );
}
