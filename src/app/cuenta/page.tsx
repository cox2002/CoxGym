"use client";

import Link from "next/link";
import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import Icono from "@/components/Icono";
import { mensajeErrorCuenta, terminarRecuperacion, useCuenta } from "@/lib/cuenta";
import { olvidarHistorial, recargarHistorial, useHistorialNube } from "@/lib/historial";
import { getFechaISOHoy } from "@/lib/rutina";
import {
  sincronizar,
  useEstadoSincronizacion,
  usePendientes,
} from "@/lib/sincronizacion";
import { getSupabase, SUPABASE_CONFIGURADO } from "@/lib/supabase";

type Modo = "entrar" | "crear" | "olvide";

function Campo({
  etiqueta,
  ...props
}: { etiqueta: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-tenue">{etiqueta}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-xl border border-borde-alto bg-campo px-3.5 py-3 text-base font-semibold text-texto outline-none placeholder:text-[#64707d] focus:ring-2 focus:ring-acento/60"
      />
    </label>
  );
}

function Aviso({ tipo, children }: { tipo: "error" | "ok"; children: ReactNode }) {
  return (
    <p
      role={tipo === "error" ? "alert" : "status"}
      className={`rounded-xl px-3.5 py-2.5 text-[13px] leading-snug font-semibold ${
        tipo === "error"
          ? "border border-[#3b1f24] bg-[#1c1114] text-peligro"
          : "border border-acento-borde bg-acento-fondo text-acento-claro"
      }`}
    >
      {children}
    </p>
  );
}

const BOTON_PRINCIPAL =
  "w-full rounded-[16px] bg-acento p-3.5 text-[15px] font-extrabold text-sobre-acento disabled:opacity-60";

function FormularioAcceso() {
  const [modo, setModo] = useState<Modo>("entrar");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;

    setEnviando(true);
    setError(null);
    setAviso(null);
    const volverA = `${window.location.origin}/cuenta`;

    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
      if (error) setError(mensajeErrorCuenta(error));
    } else if (modo === "crear") {
      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: clave,
        options: { emailRedirectTo: volverA },
      });
      if (error) setError(mensajeErrorCuenta(error));
      else if (!data.session) {
        setAviso(`Te enviamos un correo a ${correo}. Abre el enlace para confirmar la cuenta y luego entra.`);
        setModo("entrar");
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(correo, { redirectTo: volverA });
      if (error) setError(mensajeErrorCuenta(error));
      else setAviso(`Si existe una cuenta con ${correo}, te llegará un enlace para elegir otra contraseña.`);
    }
    setEnviando(false);
  }

  const titulos: Record<Modo, string> = {
    entrar: "Entrar",
    crear: "Crear cuenta",
    olvide: "Recuperar contraseña",
  };

  return (
    <>
      {modo !== "olvide" && (
        <div className="mt-6 grid grid-cols-2 rounded-2xl border border-borde bg-superficie p-1" role="tablist">
          {(["entrar", "crear"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={modo === m}
              onClick={() => {
                setModo(m);
                setError(null);
              }}
              className={`rounded-xl py-2.5 text-[14px] font-bold ${
                modo === m ? "bg-superficie-alta text-texto" : "text-apagado"
              }`}
            >
              {titulos[m]}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={enviar} className="mt-5 grid gap-3.5">
        {modo === "olvide" && (
          <h2 className="text-[17px] font-bold">Recuperar contraseña</h2>
        )}
        <Campo
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value.trim())}
          placeholder="tu@correo.com"
        />
        {modo !== "olvide" && (
          <Campo
            etiqueta="Contraseña"
            type="password"
            autoComplete={modo === "crear" ? "new-password" : "current-password"}
            required
            minLength={modo === "crear" ? 8 : undefined}
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder={modo === "crear" ? "Mínimo 8 caracteres" : ""}
          />
        )}

        {error && <Aviso tipo="error">{error}</Aviso>}
        {aviso && <Aviso tipo="ok">{aviso}</Aviso>}

        <button type="submit" disabled={enviando} className={BOTON_PRINCIPAL}>
          {enviando
            ? "Un momento…"
            : modo === "olvide"
              ? "Enviar enlace"
              : titulos[modo]}
        </button>

        <button
          type="button"
          onClick={() => {
            setModo(modo === "olvide" ? "entrar" : "olvide");
            setError(null);
          }}
          className="mx-auto px-3 py-1.5 text-[13px] font-semibold text-tenue"
        >
          {modo === "olvide" ? "Volver" : "¿Olvidaste tu contraseña?"}
        </button>
      </form>
    </>
  );
}

function NuevaClave() {
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: clave });
    setEnviando(false);
    if (error) setError(mensajeErrorCuenta(error));
    else terminarRecuperacion();
  }

  return (
    <form onSubmit={guardar} className="mt-6 grid gap-3.5">
      <h2 className="text-[17px] font-bold">Elige una contraseña nueva</h2>
      <Campo
        etiqueta="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={clave}
        onChange={(e) => setClave(e.target.value)}
      />
      {error && <Aviso tipo="error">{error}</Aviso>}
      <button type="submit" disabled={enviando} className={BOTON_PRINCIPAL}>
        {enviando ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}

function SesionIniciada({ correo }: { correo: string }) {
  const pendientes = usePendientes();
  const estado = useEstadoSincronizacion();
  const nube = useHistorialNube();
  const [actualizando, setActualizando] = useState(false);

  async function actualizarAhora() {
    setActualizando(true);
    await sincronizar();
    await recargarHistorial(getFechaISOHoy());
    setActualizando(false);
  }

  async function salir() {
    const supabase = getSupabase();
    if (!supabase) return;
    if (
      pendientes > 0 &&
      !window.confirm(`Hay ${pendientes} cambios sin subir. Si sales ahora se subirán cuando vuelvas a entrar. ¿Salir?`)
    ) {
      return;
    }
    await supabase.auth.signOut();
    olvidarHistorial();
  }

  const textoEstado = estado.sincronizando
    ? "Subiendo cambios…"
    : pendientes > 0
      ? estado.errorRed
        ? `${pendientes} cambios esperando conexión`
        : `${pendientes} cambios por subir`
      : "Todo guardado en la nube";

  return (
    <div className="mt-6 grid gap-2">
      <section className="rounded-[20px] border border-borde bg-superficie p-4">
        <p className="text-[11px] font-semibold text-tenue">Sesión iniciada</p>
        <p className="mt-1 truncate text-[16px] font-bold">{correo}</p>
      </section>

      <section className="rounded-[20px] border border-borde bg-superficie p-4">
        <div className="flex items-center gap-3">
          <Icono
            nombre={pendientes > 0 ? "nube" : "check"}
            className={`size-5 shrink-0 ${pendientes > 0 ? "text-tenue" : "text-acento"}`}
            grosor={2}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold">{textoEstado}</p>
            <p className="mt-0.5 text-[12px] text-tenue">
              {nube.descargadoEn
                ? `Historial actualizado ${new Intl.DateTimeFormat("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(nube.descargadoEn))}`
                : "Historial aún no descargado"}
            </p>
          </div>
        </div>
        {estado.rechazadas > 0 && (
          <p className="mt-3 text-[12px] text-peligro">
            {estado.rechazadas} cambios no se pudieron guardar (datos fuera de rango).
          </p>
        )}
        <button
          type="button"
          onClick={actualizarAhora}
          disabled={actualizando}
          className="mt-3.5 w-full rounded-xl border border-borde-alto py-2.5 text-[13px] font-bold text-suave disabled:opacity-60"
        >
          {actualizando ? "Sincronizando…" : "Sincronizar ahora"}
        </button>
      </section>

      <button
        type="button"
        onClick={salir}
        className="mt-3 rounded-xl px-3 py-2.5 text-[14px] font-bold text-peligro"
      >
        Cerrar sesión
      </button>
    </div>
  );
}

export default function PaginaCuenta() {
  const { cargando, usuario, recuperandoClave } = useCuenta();

  return (
    <div className="animate-entra px-[22px] pt-3.5">
      <Link href="/progreso" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-tenue">
        <Icono nombre="atras" className="size-[15px]" />
        Progreso
      </Link>

      <header className="mt-3.5">
        <p className="text-[11px] font-bold tracking-[1.6px] text-apagado uppercase">Nube</p>
        <h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.6px]">Mi cuenta</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-tenue">
          Tus series, pesos, medidas y fotos se guardan en tu cuenta y se ven desde cualquier dispositivo.
          Sin conexión, la app sigue funcionando y sube todo después.
        </p>
      </header>

      {!SUPABASE_CONFIGURADO ? (
        <div className="mt-6">
          <Aviso tipo="error">
            Falta configurar Supabase (NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).
          </Aviso>
        </div>
      ) : cargando ? (
        <div className="mt-6 h-40 animate-pulse rounded-[20px] bg-superficie" aria-hidden="true" />
      ) : usuario && recuperandoClave ? (
        <NuevaClave />
      ) : usuario ? (
        <SesionIniciada correo={usuario.email ?? "Cuenta sin correo"} />
      ) : (
        <FormularioAcceso />
      )}
    </div>
  );
}
