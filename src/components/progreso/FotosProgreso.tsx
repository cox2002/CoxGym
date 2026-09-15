"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import Icono from "@/components/Icono";
import { fechaCorta } from "@/lib/fechas";
import { anotarFoto, quitarFoto, type FotoHistorial } from "@/lib/historial";
import { getSupabase } from "@/lib/supabase";

interface Props {
  fotos: FotoHistorial[];
  hoy: string;
  userId: string | null;
}

const BUCKET = "fotos-progreso";
const LADO_MAXIMO = 1440;

/** Reduce la foto del teléfono (varios MB) a un JPG de ~300 KB antes de subirla. */
async function comprimir(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d")?.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();

  return new Promise((resolver, rechazar) =>
    lienzo.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new Error("No se pudo procesar la foto"))),
      "image/jpeg",
      0.85,
    ),
  );
}

export default function FotosProgreso({ fotos, hoy, userId }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<FotoHistorial | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  // Las fotos son privadas: se piden enlaces temporales (1 hora) para verlas.
  const rutas = fotos.map((f) => f.ruta).join("|");
  useEffect(() => {
    const supabase = getSupabase();
    const faltan = rutas ? rutas.split("|").filter((r) => !urls[r]) : [];
    if (!supabase || !userId || faltan.length === 0) return;

    let cancelado = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(faltan, 3600)
      .then(({ data }) => {
        if (cancelado || !data) return;
        const nuevas: Record<string, string> = {};
        for (const item of data) {
          if (item.path && item.signedUrl) nuevas[item.path] = item.signedUrl;
        }
        setUrls((actuales) => ({ ...actuales, ...nuevas }));
      });
    return () => {
      cancelado = true;
    };
    // `urls` no va en la lista: solo se piden las que faltan cuando cambian las fotos.
  }, [rutas, userId]);

  async function subir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    const supabase = getSupabase();
    if (!archivo || !supabase || !userId) return;

    setSubiendo(true);
    setError(null);
    try {
      const blob = await comprimir(archivo);
      const ruta = `${userId}/${hoy}-${crypto.randomUUID()}.jpg`;
      const { error: errorSubida } = await supabase.storage
        .from(BUCKET)
        .upload(ruta, blob, { contentType: "image/jpeg" });
      if (errorSubida) throw errorSubida;

      const { data, error: errorFila } = await supabase
        .from("fotos_progreso")
        .insert({ fecha: hoy, ruta })
        .select("id, fecha, ruta")
        .single();
      if (errorFila) throw errorFila;

      setUrls((actuales) => ({ ...actuales, [ruta]: URL.createObjectURL(blob) }));
      anotarFoto(data);
    } catch (e) {
      console.warn("[CoxGym] No se pudo subir la foto:", e);
      setError("No se pudo subir la foto. Revisa la conexión e inténtalo de nuevo.");
    } finally {
      setSubiendo(false);
    }
  }

  async function borrar(foto: FotoHistorial) {
    const supabase = getSupabase();
    if (!supabase || !window.confirm("¿Borrar esta foto? No se puede recuperar.")) return;

    const { error: errorFila } = await supabase.from("fotos_progreso").delete().eq("id", foto.id);
    if (errorFila) {
      setError("No se pudo borrar la foto. Inténtalo con conexión.");
      return;
    }
    await supabase.storage.from(BUCKET).remove([foto.ruta]);
    quitarFoto(foto.id);
    setAbierta(null);
  }

  if (!userId) {
    return (
      <section className="rounded-[20px] border border-borde bg-superficie p-4">
        <h2 className="text-[10.5px] font-bold tracking-[1.4px] text-apagado uppercase">Fotos de progreso</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-tenue">
          Las fotos se guardan privadas en tu cuenta.{" "}
          <Link href="/cuenta" className="font-bold text-acento">
            Inicia sesión
          </Link>{" "}
          para subirlas.
        </p>
      </section>
    );
  }

  const primera = fotos[0];
  const ultima = fotos.length > 1 ? fotos[fotos.length - 1] : null;

  const tarjetaFoto = (foto: FotoHistorial, etiqueta: string) => (
    <button
      key={foto.id}
      type="button"
      onClick={() => setAbierta(foto)}
      className="relative h-[190px] overflow-hidden rounded-[18px] border border-borde bg-[#0d1216] text-left"
    >
      {urls[foto.ruta] && (
        <img src={urls[foto.ruta]} alt={`Foto de progreso del ${fechaCorta(foto.fecha)}`} className="size-full object-cover" />
      )}
      <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-texto backdrop-blur-sm">
        {etiqueta} · {fechaCorta(foto.fecha)}
      </span>
    </button>
  );

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <h2 className="text-[10.5px] font-bold tracking-[1.4px] text-apagado uppercase">Fotos de progreso</h2>
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={subiendo}
          className="flex items-center gap-1.5 rounded-full border border-borde-alto px-3 py-1.5 text-[12px] font-bold text-suave disabled:opacity-50"
        >
          <Icono nombre="camara" className="size-4" grosor={1.9} />
          {subiendo ? "Subiendo…" : "Subir foto"}
        </button>
        <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={subir} />
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs font-semibold text-peligro">
          {error}
        </p>
      )}

      {!primera ? (
        <div className="grid grid-cols-2 gap-2">
          {["Inicio", "Hoy"].map((texto) => (
            <button
              key={texto}
              type="button"
              onClick={() => entrada.current?.click()}
              className="flex h-[190px] flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-borde-alto bg-[#0d1216] text-[12px] font-semibold text-apagado"
            >
              <Icono nombre="camara" className="size-6" grosor={1.6} />
              {texto}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {tarjetaFoto(primera, "Inicio")}
          {ultima ? (
            tarjetaFoto(ultima, "Última")
          ) : (
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              className="flex h-[190px] flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-borde-alto bg-[#0d1216] text-[12px] font-semibold text-apagado"
            >
              <Icono nombre="camara" className="size-6" grosor={1.6} />
              Sube otra para comparar
            </button>
          )}
        </div>
      )}

      {fotos.length > 2 && (
        <ul className="mt-2 grid grid-cols-4 gap-1.5">
          {fotos.map((foto) => (
            <li key={foto.id}>
              <button
                type="button"
                onClick={() => setAbierta(foto)}
                className="block aspect-[3/4] w-full overflow-hidden rounded-xl border border-borde bg-[#0d1216]"
                aria-label={`Ver foto del ${fechaCorta(foto.fecha)}`}
              >
                {urls[foto.ruta] && <img src={urls[foto.ruta]} alt="" className="size-full object-cover" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {abierta &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto del ${fechaCorta(abierta.fecha)}`}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+16px)]"
        >
          <div className="mx-auto flex w-full max-w-md items-center justify-between">
            <p className="text-[14px] font-bold">{fechaCorta(abierta.fecha)}</p>
            <button type="button" onClick={() => setAbierta(null)} className="px-2 py-1 text-[14px] font-bold text-acento">
              Cerrar
            </button>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center overflow-hidden py-4">
            {urls[abierta.ruta] && (
              <img src={urls[abierta.ruta]} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
            )}
          </div>
          <button
            type="button"
            onClick={() => borrar(abierta)}
            className="mx-auto flex items-center gap-2 rounded-xl border border-[#3b1f24] px-4 py-2.5 text-[13px] font-bold text-peligro"
          >
            <Icono nombre="basura" className="size-4" grosor={1.9} />
            Borrar foto
          </button>
        </div>,
        document.body,
      )}
    </section>
  );
}
