// Copia del dataset hasaneyldrm/exercises-dataset solo lo que usa la rutina:
// nombre, equipo, músculos, pasos en español y la ruta de la animación.
//
// Uso: node scripts/importar-ejercicios.mjs
//
// Cada ejercicio de src/data/rutina.json indica su "animacion" (el id de 4
// dígitos del dataset). Se corre de nuevo cuando se agrega o cambia un id.
// Las animaciones NO se descargan: la app las enlaza desde GitHub (© Gym visual).

import { readFile, writeFile } from "node:fs/promises";

// Commit fijo: si el dataset se reorganiza, la app no se rompe.
const COMMIT = "7455efae41b330c265e7cd4b78dfa848e7ce5ebd";
const URL_DATASET = `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/${COMMIT}/data/exercises.json`;

const RUTINA = new URL("../src/data/rutina.json", import.meta.url);
const SALIDA = new URL("../src/data/ejercicios-dataset.json", import.meta.url);

const rutina = JSON.parse(await readFile(RUTINA, "utf8"));
const ids = new Set(
  rutina.semana.flatMap((dia) =>
    dia.ejercicios.map((e) => e.animacion).filter(Boolean),
  ),
);

console.log(`Descargando dataset (${COMMIT.slice(0, 7)})…`);
const respuesta = await fetch(URL_DATASET);
if (!respuesta.ok) {
  throw new Error(`No se pudo descargar el dataset: HTTP ${respuesta.status}`);
}
const dataset = await respuesta.json();

const salida = {};
for (const id of [...ids].sort()) {
  const e = dataset.find((x) => x.id === id);
  if (!e) {
    throw new Error(`El id "${id}" no existe en el dataset`);
  }
  salida[id] = {
    nombre: e.name,
    equipo: e.equipment,
    objetivo: e.target,
    secundarios: e.secondary_muscles,
    pasos: e.instruction_steps?.es ?? [],
    gif: e.gif_url,
    imagen: e.image,
  };
}

await writeFile(
  SALIDA,
  JSON.stringify({ commit: COMMIT, ejercicios: salida }, null, 2) + "\n",
);
console.log(`Listo: ${Object.keys(salida).length} ejercicios en src/data/ejercicios-dataset.json`);
