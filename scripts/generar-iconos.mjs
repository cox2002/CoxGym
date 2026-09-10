/**
 * Genera los íconos PNG de la PWA sin librerías externas: dibuja una mancuerna
 * pixel a pixel y escribe el PNG a mano (zlib viene con Node).
 *
 *   node scripts/generar-iconos.mjs
 *
 * Solo hay que volver a correrlo si cambian los colores o el dibujo.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(RAIZ, "public", "icons");

const FONDO = [0x0a, 0x0d, 0x11];
const ACENTO = [0x38, 0xbd, 0xf8];

/* ---------- PNG mínimo (color RGB, 8 bits) ---------- */

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = TABLA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloque(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

function codificarPng(lado, pixeles) {
  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(lado, 0);
  cabecera.writeUInt32BE(lado, 4);
  cabecera[8] = 8; // bits por canal
  cabecera[9] = 2; // color RGB
  // 10, 11, 12 quedan en 0: compresión, filtro e interlazado estándar.

  // Cada fila lleva adelante un byte de filtro (0 = sin filtro).
  const filas = [];
  for (let y = 0; y < lado; y++) {
    filas.push(Buffer.from([0]));
    filas.push(pixeles.subarray(y * lado * 3, (y + 1) * lado * 3));
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque("IHDR", cabecera),
    bloque("IDAT", deflateSync(Buffer.concat(filas), { level: 9 })),
    bloque("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- Dibujo de la mancuerna ---------- */

/** Rectángulo con esquinas redondeadas, en coordenadas de -0.5 a 0.5. */
function dentroDeRect(x, y, mediaAncho, mediaAlto, radio) {
  const dx = Math.abs(x) - (mediaAncho - radio);
  const dy = Math.abs(y) - (mediaAlto - radio);
  if (dx <= 0 || dy <= 0) {
    return Math.abs(x) <= mediaAncho && Math.abs(y) <= mediaAlto;
  }
  return dx * dx + dy * dy <= radio * radio;
}

/** Mancuerna: barra al centro, dos discos grandes y dos chicos por lado. */
function dentroDeMancuerna(x, y) {
  if (dentroDeRect(x, y, 0.27, 0.055, 0.03)) return true; // barra
  for (const signo of [-1, 1]) {
    if (dentroDeRect(x - signo * 0.345, y, 0.075, 0.34, 0.04)) return true;
    if (dentroDeRect(x - signo * 0.465, y, 0.045, 0.21, 0.03)) return true;
  }
  return false;
}

/**
 * @param lado      tamaño en píxeles
 * @param proporcion cuánto del ancho ocupa el dibujo (los íconos "maskable"
 *                   usan menos para que el recorte del sistema no lo corte)
 */
function dibujarIcono(lado, proporcion) {
  const pixeles = Buffer.alloc(lado * lado * 3);
  const centro = (lado - 1) / 2;
  const escala = lado * proporcion;
  const MUESTRAS = 4; // suavizado de bordes por supermuestreo

  for (let py = 0; py < lado; py++) {
    for (let px = 0; px < lado; px++) {
      let dentro = 0;

      for (let sy = 0; sy < MUESTRAS; sy++) {
        for (let sx = 0; sx < MUESTRAS; sx++) {
          const x = (px + (sx + 0.5) / MUESTRAS - 0.5 - centro) / escala;
          const y = (py + (sy + 0.5) / MUESTRAS - 0.5 - centro) / escala;
          if (dentroDeMancuerna(x, y)) dentro++;
        }
      }

      const cobertura = dentro / (MUESTRAS * MUESTRAS);
      const base = (py * lado + px) * 3;
      for (let canal = 0; canal < 3; canal++) {
        pixeles[base + canal] = Math.round(
          FONDO[canal] + (ACENTO[canal] - FONDO[canal]) * cobertura,
        );
      }
    }
  }

  return codificarPng(lado, pixeles);
}

/* ---------- Salida ---------- */

const ICONOS = [
  { archivo: "icon-192.png", lado: 192, proporcion: 0.78 },
  { archivo: "icon-512.png", lado: 512, proporcion: 0.78 },
  { archivo: "icon-512-maskable.png", lado: 512, proporcion: 0.52 },
  { archivo: "apple-touch-icon.png", lado: 180, proporcion: 0.7 },
];

mkdirSync(DESTINO, { recursive: true });

for (const { archivo, lado, proporcion } of ICONOS) {
  writeFileSync(join(DESTINO, archivo), dibujarIcono(lado, proporcion));
  console.log(`✓ public/icons/${archivo} (${lado}×${lado})`);
}
